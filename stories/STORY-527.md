# STORY-527 : Plan d'amortissement — les dotations se calculent, avec leur formule, et le prorata temporis n'est pas optionnel

Status: in_progress

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
