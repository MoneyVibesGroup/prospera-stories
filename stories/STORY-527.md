# STORY-527 : Plan d'amortissement — les dotations se calculent, avec leur formule, et le prorata temporis n'est pas optionnel

Status: done

**Épic :** EPIC-135 — Immobilisations et amortissements
**Service :** module `immobilisations` de `balance-service` — ⚠️ **+ `dossier-service`** (copie à l'octet du paquet fiscal, M3)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-526** (le registre) · ⚠️ STORY-532 n'est **pas** bloquante pour ce moteur (M1)
**Origine :** §6.2 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

Un plan d'amortissement se calcule à partir de six données — valeur d'origine, valeur résiduelle,
date de mise en service, durée d'utilité, mode, et **durée de l'exercice**. La sixième est celle
qu'on oublie, et elle vient d'être trouvée manquante ailleurs (STORY-532) : **un exercice de 18 ou
de 6 mois ne porte pas une dotation de 12 mois**.

Deux règles que le SYSCOHADA impose et qu'un moteur naïf rate :

1. **Le prorata temporis la première année**, calculé depuis la **mise en service** — pas une année
   pleine, pas une demi-année forfaitaire.
2. **La dotation est plafonnée par la valeur nette restante** : le cumul des amortissements ne
   dépasse jamais la valeur amortissable. ⚡ C'est exactement la garde métier « amort ≤ brut » déjà
   appliquée aux maquettes — ici elle devient un invariant de calcul.

## Critères d'acceptation

- [ ] AC-1 — Modes **linéaire** et **dégressif** (avec son coefficient, publié par le référentiel ou
      le paquet fiscal, jamais codé). Un mode non supporté est **refusé**, pas approximé.
- [ ] AC-2 — **Prorata temporis** depuis la date de mise en service, sur la **durée réelle de
      l'exercice** (STORY-532). ⛔ Test : un exercice de 6 mois produit la moitié d'une dotation
      annuelle. S'il produit une dotation pleine, tout le plan est faux.
- [ ] AC-3 — ⛔ **Chaque dotation porte sa formule** — base × taux × prorata — comme chaque écriture
      d'impôt du moteur fiscal. Un montant sans sa formule est un chiffre qu'il faut croire.
- [ ] AC-4 — **Invariant : cumul des amortissements ≤ valeur amortissable**, vérifié à chaque
      dotation, jamais seulement à l'affichage.
- [ ] AC-5 — Une **cession** ou une **mise au rebut** en cours d'exercice produit une dotation
      **jusqu'à la date de sortie**, puis la sortie du bien : valeur nette comptable, prix de
      cession, plus ou moins-value. ⚠️ La plus-value est un **produit de cession**, pas une reprise
      d'amortissement.
- [ ] AC-6 — Le plan se **rejoue à l'identique** : recalculer l'exercice 2024 en 2026 rend les mêmes
      dotations.

---

# Cadrage sur le texte — fait AVANT toute ligne de code

Sources : **Art. 100 du CGI togolais**, lu verbatim dans le corpus officiel au dépôt
(`referentiels/corpus-complet-cgi-lpf-togo.json`, édition OTR 2025, p. 55-56) ; **AUDCIF 2017** relayé
par le fonctionnement du compte 28 du SYSCOHADA révisé ; le paquet `togo@2026` packagé dans
`balance-service` ; le read-model `exercices_dossier` et le code de `dossier-service`.

> ⚠️ Un texte fiscal change par loi de finances. Le relevé porte sa date ; un relecteur **recompare**.

## Les constats mesurés

### M1 — ⚡ La dépendance à STORY-532 ne bloque pas CE moteur

STORY-532 porte sur la **liasse de `bilan-service`** : `CreerJeuEtatsDto` ne connaît qu'un libellé
d'exercice. Le moteur de cette story vit dans **`balance-service`**, dont le read-model
`exercices_dossier` (STORY-355, alimenté par `dossier.exercice.*`) porte **déjà** les bornes réelles de
chaque exercice du dossier — début et fin à minuit UTC, fin incluse, sans contrainte de durée. Le
moteur les lit **là** : héritées du dossier, jamais saisies, jamais déduites du libellé — la règle même
de l'AC-1 de 532. La chaîne `532 → 527` du §10 de l'analyse reste vraie **pour la liasse** (la DSF doit
publier la durée) ; elle ne l'est pas pour le calcul.

### M2 — Le texte fixe le point de départ et la base, PAS la convention de prorata

AUDCIF, compte 28 : *« La date de début d'amortissement est la date à laquelle l'actif immobilisé est
en l'état et en lieu d'utilisation prévue par l'entité »* ; *« le montant du bien amortissable s'entend
de la différence entre le coût d'entrée d'un actif et sa valeur résiduelle »*. **Aucune** convention de
décompte du temps n'y figure. Deux conventions sont en usage, et elles ne donnent pas le même chiffre :

| Convention | Exercice du 1ᵉʳ janvier au 30 juin | Exercice du 1ᵉʳ juillet au 31 décembre |
|---|---|---|
| jours réels / 365 | 181/365 = **0,4959** | 184/365 = **0,5041** |
| **30/360** (mois de 30 jours) | 180/360 = **½** | 180/360 = **½** |

⇒ Sous les jours réels, **le test de l'AC-2 échoue** — et le chiffre dépend du semestre. La convention
retenue est **30/360** (pratique OHADA courante, pas un texte), **publiée dans chaque formule** : un
lecteur voit sur quoi repose le prorata au lieu de le supposer. Sa propriété qui compte : le décompte
est la différence d'une **position** (`360 × année + 30 × mois + min(jour, 30)`), donc **additif** —
deux exercices contigus totalisent exactement leur réunion, quelle que soit la coupure.

### M3 — ⛔ Le paquet ne publie AUCUN coefficient : il faut le transcrire, et c'est un dépôt de plus

Le paquet `togo@2026` porte l'art. 100 **en prose** seulement : *« lineaire, degressif ou accelere
(Art. 100) »*. L'article, lui, publie le barème :

> *« Le taux dégressif est obtenu par application aux taux d'amortissement linéaire affecté d'un
> coefficient fixé en fonction de la durée de vie du bien comme ci-après : 1,5 lorsque la durée normale
> d'utilisation du bien est de trois (03) ou quatre (04) ans ; 2 lorsque cette durée normale est de cinq
> (05) ou six (06) ans ; 2,5 lorsque cette durée normale est supérieure à six (06) ans. »*

⇒ L'AC-1 (« publié par le paquet, jamais codé ») exige de **transcrire ce barème en donnée
structurée**, comme STORY-091 l'a fait pour l'art. 101 (`resultatFiscal.reportDeficitaire`). Le paquet
change d'octets, donc d'empreinte — et `dossier-service` en porte une **copie à l'octet** gardée par
une empreinte (patron STORY-368, recopiée à chaque changement : STORY-412, 413, 415, 493). **Trois
dépôts**, pas deux : `balance-service`, `dossier-service`, `docs/`.

### M4 — ⛔⛔ Le CGI et l'AUDCIF ne font pas partir le dégressif du même jour

Art. 100 : *« Le point de départ du calcul de l'amortissement dégressif est constitué par le premier
jour du mois d'acquisition ou de création du bien. »* L'AUDCIF et l'AC-2 : la **mise en service**. Un
bien acquis le 20 mars et mis en service le 15 juin part du 1ᵉʳ mars pour le fisc, du 15 juin pour la
comptabilité.

⇒ Ce plan est le plan **comptable** : c'est lui qui rejoindra la balance (STORY-528). Il part donc de la
mise en service, pour les deux modes, et emprunte au CGI **son coefficient** — seule source publiée
d'un taux dégressif. L'écart entre ce plan et le plan fiscal qu'on obtiendrait depuis le premier jour du
mois d'acquisition est **l'amortissement dérogatoire** : hors périmètre, fiché, et la règle fiscale
est transcrite au paquet **en le disant**, pour que 528 ou la story du dérogatoire la trouvent.

### M5 — ⚠️ « Valeur résiduelle » veut dire DEUX choses selon le texte

L'AUDCIF appelle valeur résiduelle le **prix de sortie estimé en fin d'utilité**. L'art. 100 écrit
*« le rapport de la valeur résiduelle au nombre d'années restant à courir »* — il parle de la **valeur
nette** restante. Lire le mot du CGI au sens de l'AUDCIF calculerait la bascule en linéaire sur le
prix de sortie : un plan qui ne s'éteint jamais. ⇒ La bascule porte sur **(valeur nette − valeur
résiduelle AUDCIF) / durée restante**, ce qui amène la valeur nette exactement sur la valeur
résiduelle à la fin de la durée d'utilité.

### M6 — Le barème est en ANNÉES ENTIÈRES ; une durée de 54 mois n'y est pas

Le registre porte la durée en **mois** (D-526-2). « Trois ou quatre ans », « cinq ou six ans »,
« supérieure à six ans » : une durée de 4,5 ans n'est **dans aucune tranche** au sens du texte. ⇒ Le
dégressif exige une durée en années entières, **au moins trois** (en dessous, le texte l'exclut). Hors
barème ⇒ refus à l'inscription, jamais une tranche choisie par proximité. « Supérieure à six ans » se
transcrit donc **sept et plus**.

### M7 — Les conditions du dégressif ne sont pas vérifiables ici

Art. 100 : réservé aux **matériels et outillages neufs** d'une entreprise **à l'IS** ; exclus les
autres immobilisations, les biens usagés, les durées de moins de trois ans. Le registre ne dit ni
« neuf » ni la nature du bien (M4 de STORY-526 : aucun plan ne la qualifie). ⇒ La durée est vérifiée ;
**le reste est publié tel quel dans le plan, sous un nom qui dit que le moteur ne l'a pas vérifié** —
jamais passé sous silence, jamais affirmé.

### M8 — Arrondir à l'unité MINEURE publierait des centimes de franc qui n'existent pas

Les montants sont des entiers en unités mineures de l'échelle **appliquée** (× 100 pour le franc CFA,
STORY-489), alors que l'exposant ISO 4217 du franc CFA vaut **0**. Une dotation arrondie à l'unité
mineure afficherait « 166 666,67 XOF ». ⇒ L'arrondi se fait à l'**unité monétaire** —
`10^(exposant appliqué − exposant ISO)` unités mineures, soit 100 pour le XOF et 1 pour l'euro — au
plus proche, demi vers le haut, et le **pas est publié** dans la formule. La dernière dotation (fin de
durée d'utilité) est le **solde exact** de la valeur amortissable : c'est elle qui absorbe les écarts
d'arrondi, et elle seule.

### M9 — Le moteur ne connaît que les exercices OUVERTS par le dossier

`dossier-service` ne publie que les exercices ouverts (ou repris). Au-delà du dernier, les bornes
n'existent pas : les supposer de douze mois serait **inventer des dates** — exactement ce que 532
interdit. ⇒ Le plan s'arrête au dernier exercice connu et publie le **reste à amortir** ; deux
exercices qui ne se touchent pas (trou, chevauchement) l'**interrompent** au lieu d'être comblés.

### M10 — La réévaluation n'est dans aucun AC

Le registre l'enregistre (STORY-526) ; ses effets (écart de réévaluation, amortissements recalculés
sur la valeur réévaluée) demandent leur propre cadrage sur le texte. ⇒ Le plan s'**interrompt** avant
l'exercice de la première réévaluation. Il ne refuse pas le tout : les exercices antérieurs restent
calculés et **inchangés**, ce qu'exige l'AC-6.

## Les décisions

**D-527-1 — Un moteur PUR.** `plan-amortissement.regles.ts` : fonction de la fiche figée, des
mouvements effectifs et des exercices du dossier. Aucune horloge, aucune base, aucun paquet relu ⇒
l'AC-6 tient **par construction** : rien de ce qui change entre 2024 et 2026 n'entre dans le calcul de
2024. Arithmétique **entière** (`bigint`) : aucune dérive flottante, aucun arrondi caché.

**D-527-2 — Prorata 30/360**, publié dans chaque formule (M2).

**D-527-3 — Linéaire** : `dotation = base amortissable × (12 / durée en mois) × (jours / 360)`.

**D-527-4 — Dégressif** : `valeur nette × (coefficient × 12 / durée en mois) × (jours / 360)`, puis
**bascule** dès que `(valeur nette − valeur résiduelle) × jours / jours restants` lui est supérieure
(M5) — ce qui reproduit « un amortissement égal à ce montant pour chacune des années restantes ». Point
de départ : la mise en service (M4).

**D-527-5 — Le coefficient est résolu À L'ACQUISITION et FIGÉ** sur le mouvement, avec sa source
(paquet, empreinte, article) et ses conditions : paquet du **pays du dossier**, année de clôture de
l'exercice d'acquisition — le point unique de résolution du service (`chargerPaquetFiscal`). Le plan
ne relit **jamais** le paquet : une régénération ultérieure ne réécrit pas un plan passé. Paquet sans
barème ⇒ `409 COEFFICIENT_DEGRESSIF_NON_PUBLIE` ; durée hors barème ⇒ `400
DUREE_HORS_BAREME_DEGRESSIF` (M6).

**D-527-6 — Arrondi à l'unité monétaire**, demi vers le haut, pas publié ; solde exact en fin de vie
(M8).

**D-527-7 — AC-4 dans le moteur** : chaque dotation est plafonnée au reste à amortir, **et** le cumul
est vérifié après chacune — une violation lève, elle ne s'affiche pas.

**D-527-8 — La sortie** (AC-5) : la dernière fenêtre s'arrête au jour de sortie **inclus** ; la sortie
publie le cumul, la valeur nette, le prix (zéro pour un rebut), le **résultat de cession** et sa
nature. Aucun champ « reprise » : la plus-value est un produit de cession.

**D-527-9 — Les exercices** : on part de l'exercice du dossier qui couvre la mise en service (aucun ⇒
ou deux ⇒ `409 PLAN_INCALCULABLE`), puis de proche en proche, chaque exercice commençant le lendemain
de la fin du précédent (M9).

**D-527-10 — La route** : `GET /dossiers/:dossierId/immobilisations/:immobilisationId/plan` —
lecture, aucune écriture.

**D-527-11 — Le paquet `togo@2026` est régénéré** avec `resultatFiscal.amortissementDegressif`
(barème, conditions, bascule, point de départ fiscal, source), puis recopié à l'octet dans
`dossier-service` (M3).

## Hors périmètre — hooks inertes documentés

- **L'amortissement dérogatoire** (écart plan comptable ↔ plan fiscal : point de départ M4, durée
  fiscale M3 de 526).
- **La publication des dotations en balance** et l'état des dotations d'un exercice pour tout le
  registre : **STORY-528**.
- **Les effets d'une réévaluation** (M10), **le mode des unités de production** et **l'amortissement
  accéléré** (art. 100, régime d'agrément).
- **La projection au-delà du dernier exercice ouvert** (M9).

## Notes

- Voir [[STORY-526]], [[STORY-528]], [[STORY-532]] (la durée de l'exercice — prérequis de la
  **liasse**, M1).

## Progress Tracking

- 2026-09-22 — branche `MNV-527` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-22 — **cadrage sur le texte fait avant tout code** : 10 constats M1-M10, 11 décisions. La
  dépendance à STORY-532 ne bloque pas ce moteur (M1) ; le paquet ne publiait **aucun** coefficient,
  il faut le transcrire — un troisième dépôt (M3) ; le CGI fait partir le dégressif du premier jour du
  mois d'acquisition quand l'AUDCIF et l'AC-2 le font partir de la mise en service (M4).

- 2026-09-22 — branches `MNV-527` ouvertes **avant tout code** : `balance-service` (empilée sur
  `MNV-526`, même module) et `dossier-service` (depuis `origin/dev` @ `7cfe86a`). Développée :
  `balance-service` `1e53e9b` + `c7257bc`, `dossier-service` `1b6b744` + `9a50d35`.

### Ce qui est livré

| Fichier | Rôle |
|---|---|
| `balance-service` `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` + schéma | `resultatFiscal.amortissementDegressif` : le barème de l'Art. 100 transcrit (1,5 / 2 / 2,5), conditions, bascule, point de départ fiscal, source — paquet régénéré, sha256 `90501c8a…` |
| `…/immobilisations/bareme-degressif.regles.ts` | lecture du barème, **tout ou rien** ; tranche d'une durée en années ENTIÈRES |
| `…/immobilisations/plan-amortissement.regles.ts` | le moteur **pur** (`bigint`, 30/360, bascule, solde, plafond, sortie, interruptions) |
| `…/immobilisations/plan-amortissement.vue.ts` | pas d'arrondi dérivé des exposants (100 pour le XOF), formule en clair, projection |
| `…/immobilisations.service.ts` | coefficient résolu **à l'acquisition** et figé avec sa source ; `plan()` |
| `…/immobilisations.controller.ts` | `GET /dossiers/:dossierId/immobilisations/:immobilisationId/plan` |
| `dossier-service` `…/echeance/assets/paquet-fiscal-togo-2026.json` + empreinte | copie à l'octet (convention STORY-368) |

### ⛔ Un rouge PRÉEXISTANT dans `dossier-service`, corrigé sur décision de l'utilisateur

Les portes de `dossier-service` ont rougi (4 tests, `registre-pays.coherence.spec.ts`) — **sans rapport
avec 527** et **déjà rouges sur `dev`** : le miroir ignorait `cima-assurances@2.0` à `@5.0`, packagés
dans `balance-service` et `bilan-service` depuis STORY-518/520/521/522 (21-22/09), et la spec lisait
tout le dossier d'assets de `bilan-service`, qui porte depuis STORY-509/510/523/524 des artefacts sans
bloc `meta` (`TypeError` sur toute la batterie). Personne n'avait rejoué la suite de `dossier-service`
depuis. **Question posée à l'utilisateur, réponse : corriger dans `MNV-527`**, commit séparé
`9a50d35`, déclaré hors périmètre — miroir aligné (dix référentiels), un référentiel reconnu à son bloc
`meta`. Effet servi : `GET /pays` publie quatre versions CIMA de plus ; aucun statut de pays ne change.

### Portes — mesurées dans cette session

| Dépôt | lint · build | unitaires | couverture (instr. / branches / fonctions / lignes) | e2e |
|---|---|---|---|---|
| `balance-service` (job `tmp_f661d8fe`) | ✅ | **212 suites, 4 384** | 99,16 / 92,71 / 98,57 / 99,25 | **30 suites, 1 130** |
| `dossier-service` (job `tmp_46cbe83d`) | ✅ | **88 suites, 1 373** | 99,44 / 94,85 / 98,06 / 99,47 | **8 suites, 304** |

### Table de mutations — 19 mutations, 18 rouges, 1 équivalente

**Deux tests renforcés AVANT la passe**, parce que le raisonnement mutation par mutation montrait qu'ils
ne discriminaient pas : la tranche d'une durée non entière ne se prouve pas sur 54 ou 78 mois (hors de
toute tranche de toute façon) mais sur **42, 66, 90** ; et la bascule dégressive avec valeur résiduelle
ne se prouve pas sur le point d'arrivée, que le solde rattrape, mais sur la **table entière**.

| Mutation | Ce qu'elle casse | Rougit |
|---|---|---|
| P1 | annuité pleine dès qu'un jour est amorti — prorata ignoré (AC-2) | 6 |
| P2 | la fenêtre part du début d'exercice, pas de la mise en service (AC-2) | 4 |
| P3 | plus de plafond au reste à amortir (AC-4) | 3 — dont l'invariant qui LÈVE |
| P4 | vérification après chaque dotation neutralisée | **équivalente** : inatteignable tant que le plafond existe ; P3 prouve qu'elle se déclenche. Gardée : elle fait échouer bruyamment un changement futur du plafond |
| P5 | plus de bascule en linéaire (AC-1) | 2 |
| P6 | bascule sur la valeur nette au lieu de (valeur nette − résiduelle) (M5) | 2 |
| P7 | plus de solde exact en fin de vie | 5 |
| P8 | le 31 compte — le décompte n'est plus 30/360 | 2 |
| P9 | le jour de sortie n'est plus amorti (AC-5) | 3 |
| P10 | résultat de cession inversé (AC-5) | 3 |
| P11 | le calcul dépend de la date du jour (AC-6) | 1 |
| P12 | une réévaluation n'interrompt plus avant son exercice (M10) | 1 |
| P13 | un trou d'exercices passe pour la fin des exercices connus (M9) | 1 |
| P14 | une durée non entière entre dans une tranche (M6) | 3 |
| P15 | une tranche illisible sautée au lieu d'invalider le barème | 2 |
| P16 | paquet résolu hors de l'exercice d'acquisition (D-527-5) | 1 |
| P17 | le plan part de l'ACQUISITION (AC-2) | 2 |
| P18 | dégressif sans barème enregistré sans coefficient (AC-1) — **refaite** : la 1ʳᵉ forme ne compilait pas (« 0 total ») | 1 |
| P19 | arrondi à l'unité mineure : centimes de franc (M8) | 1 |

⚠️ **Ce que ces tests ne prouvent pas** : la persistance du coefficient figé, le plan servi sur un
exercice réellement ouvert par `dossier-service`. C'est la vérification docker, faite sur l'état final
après les revues, avec STORY-526.

- 2026-09-22 — **poussée, PR ouvertes** : `balance-service#115` (empilée sur #114) et `dossier-service#32` ; statut `in_progress` → `review`. Revue de code (⑥) et
  revue de sécurité (⑦) en cours.

### Revue de code (⑥) — 6 constats, dont 1 bloquant, tous corrigés — `balance-service` `fe5cda3`

Scan `prospera-code-review` (`opus`), constats **vérifiés un à un dans le code** avant correction ; lentille
`ponytail-review` en second.

| # | Constat | Correction | Mutation |
|---|---|---|---|
| 1 ⛔ | **La provenance du coefficient perdait le paquet hérité.** `sourceCoefficient` était recomposé à la main (`pays@année` + une empreinte) : en zone franche, seule l'empreinte de la SURCOUCHE restait, pas celle de `togo@2026` d'où vient le barème. Registre append-only : irrattrapable après coup | la fiche fige le tampon `versTamponPaquetFiscal` ENTIER (`regime`, `base` et son empreinte compris) — schéma, relecture, DTO `EffectifPaquetFiscalStampDto` | R1, R2, R7 rouges |
| 2 | Les doubles de test publiaient `TG@2026` ; le chargeur publie `togo@2026` (clé de manifeste) | doubles alignés sur le chargeur | — |
| 3 | Sortie datée du **dernier jour** de l'exercice non protégée (`<=` → `<` : 94 tests verts) | deux cas : avec et sans exercice suivant ouvert | R3 rouge |
| 4 | Le test « toute réécriture est interceptée » était vrai à vide sur 5 opérations sur 8 (`timestamps` y pose déjà un crochet) | filtre sur le crochet de refus lui-même | R4 rouge |
| 5 | Le passage de la réévaluation du service au moteur (M10) n'était testé nulle part | test service → plan `INTERROMPU` | R5 rouge |
| 6 | Une dernière page exactement pleine annonçait une suite (`>` → `>=` : verts) | test de la page pleine | R6 rouge |

Ponytail : trois réutilisations — `asObjet` et `dateDansExercice` des cahiers au lieu de leurs copies,
`versVueCalcul` sans recopie champ à champ. Écartés par le relecteur, et laissés : la bascule dégressive
avec valeur résiduelle (le plafond, pas la bascule, rejoint la VR — application littérale de D-527-4,
question de cadrage), le schéma JSON du paquet plus lâche que le lecteur (latent), l'absence de 400
documenté sur `GET /immobilisations` (convention non uniforme du dépôt).

### Revue de sécurité (⑦) — 1 constat, corrigé — `balance-service` `226166e`

**Déni de service sur `GET …/immobilisations/:id/plan`** (confiance 85, CWE-407 / CWE-770). Le moteur
comparait, à chaque exercice de la chaîne, chaque exercice du dossier à tous les autres. **Mesure rejouée
dans la session** (le rapport n'est pas une preuve) : 10 000 exercices d'un jour → 4,5 s de boucle
d'événements bloquée par lecture, 20 000 → 27 s, 36 600 → 204 s — pour tous les tenants. **La voie
d'attaque existe, vérifiée en docker** : `dossier-service` n'admet qu'un exercice OUVERT à la fois, mais
un exercice de reprise `MIGRATION` naît `CLOS`, ne prend pas cette place, n'a ni durée minimale ni
contrôle de chevauchement — tout membre du cabinet en crée à volonté.

- **Moteur** : exercices indexés une fois (tri, un passage pour les chevauchements, table des débuts) —
  36 600 exercices : 86 ms. Même sémantique, éprouvée cas par cas.
- **Plafond** : le plan lit au plus 1 000 exercices. Au-delà, `409 PLAN_INCALCULABLE`
  `EXERCICES_TROP_NOMBREUX` — jamais une liste tronquée.
- **Écritures** : elles ne lisent plus que les exercices qui couvrent leur date (`exercicesCouvrant`).

| Mutation | Ce qu'elle casse | Rougit |
|---|---|---|
| S1 · S2 | branche « un exercice antérieur finit après son début » retirée · recouvrement d'un seul jour | 3 · 2 |
| S3 · S4 | exercice postérieur commençant le dernier jour · branche « le suivant commence avant sa fin » retirée | 1 · 2 |
| S5 · S6 | la dernière fin au lieu de la plus tardive · liste non triée | 1 · 1 |
| S7bis | comparaison deux à deux réintroduite, allégée — **refaite** : la 1ʳᵉ forme ne compilait pas (« 0 total ») | 1 |
| S8 · S9 | liste tronquée rendue au-delà du plafond · chargement sans limite | 1 · 1 |
| S10 · S11 | le plan ignore le dépassement · l'écriture recharge le dossier entier | 1 · 1 |
| S12 | premier jour de l'exercice exclu de la lecture ciblée | 1 |

⚡ **Le test de coût a été dimensionné sur mesure, pas choisi** : à 20 000 exercices, une comparaison
deux à deux allégée tient en 1,5 s et passait sous un seuil de 2 s. À 40 000 elle prend 12 s ; l'index,
0,1 s (0,5 s sous instrumentation) — seuil posé à 3 s.

Hors périmètre, **à porter par une story `dossier-service`** : borner le nombre, la durée et le
chevauchement des exercices (défense en profondeur), et le nombre de mouvements par immobilisation.

### Portes finales — état `226166e`, mesurées dans cette session

| Dépôt | lint · build | unitaires | couverture (instr. / branches / fonctions / lignes) | e2e |
|---|---|---|---|---|
| `balance-service` (job `tmp_d55e42d1`) | ✅ | **212 suites, 4 403** | 99,16 / 92,66 / 98,58 / 99,25 | **30 suites, 1 130** |

### Vérification docker — pile neuve (`down -v`), état final `226166e` + `dossier-service` `9a50d35`

Code en vol prouvé par le Swagger vivant (`SourceCoefficientDto {paquetFiscal, article}`,
`EXERCICES_TROP_NOMBREUX` — deux marqueurs des seuls commits de revue). Dossier TG, exercice 2026 et axes
SN créés par les **vraies routes** de `dossier-service`, arrivés par Kafka ; KYC et droit d'usage semés.

| Scénario | Mesuré |
|---|---|
| A linéaire, 45 000 000 XOF, VR 5 000 000, 60 mois, MES 01/04/2026 | 2026 : **6 000 000 XOF** (270/360) ; après clôture de 2026 et ouverture de 2027 : 2027 **8 000 000 XOF** |
| B dégressif, 1 000 000 XOF, 60 mois, MES 01/07/2026 | coefficient **2/1** ; 2026 : **200 000 XOF**, 2027 : **320 000 XOF**, formule en clair |
| Provenance figée **en base** | `sourceCoefficient.paquetFiscal` = `togo`/2026/`90501c8a…2686`/statut/mise en garde, `article: Art. 100 CGI`, sans `updatedAt` |
| AC-6 — cession de A au 30/06/2027 | ligne 2026 **identique** ; `SORTI`, VNC 35 000 000, prix 30 000 000, moins-value 5 000 000 |
| M10 — réévaluation de B au 30/09/2027 | plan `INTERROMPU` `REEVALUATION_NON_MODELISEE`, seule la ligne 2026 |
| Dégressif 54 mois · date 2028 | `400 DUREE_HORS_BAREME_DEGRESSIF` · `409 EXERCICE_INTROUVABLE` — rien d'écrit |
| Sécurité — voie d'attaque | 3 exercices de reprise d'**un jour** acceptés (`201 CLOS`, 1 jour) et propagés |
| Sécurité — 1 001 exercices au dossier | `409 PLAN_INCALCULABLE EXERCICES_TROP_NOMBREUX` en 70 ms ; une écriture 2027 sur ce dossier : `201` en 52 ms, rattachée à 2027 |
| Sécurité — 1 000 exercices exactement | plan `200` en 43 ms, lignes **identiques** à celles d'avant l'ajout |

Pile arrêtée après la vérification (`docker compose stop`).
- 2026-09-23 — **clôturée** : `balance-service#115` (re-ciblée sur `dev` après #114, arbre identique à l'état vérifié `226166e`) et `dossier-service#32` rebase-mergées sur `dev` ; branches supprimées. Statut `review` → `done`.
