# STORY-526 : Registre des immobilisations — le produit RESTITUE Brut/Amort/Net sans que rien ne le CALCULE

Status: in_progress

**Épic :** EPIC-135 — Immobilisations et amortissements
**Service :** `balance-service` / module `immobilisations` (nouveau) — ✅ **confirmé au cadrage** (M1)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Origine :** §6.2 de `analyse-scalabilite-multireferentiel-2026-08-27.md` ; `cadrage-immobilisations-2026-08-16.md`.

---

## Le fait, déjà établi par le cadrage du 2026-08-16

L'audit de couverture du 16/08 a trouvé le module **entièrement absent de la documentation** — ni
PRD, ni spine, ni épics, ni story — **seul de la vague 2 dans ce cas**. Et son constat central n'est
pas confortable :

> **Ce qui existe déjà RESTITUE l'amortissement sans que rien ne le CALCULE.**
> `STORY-059` produit le bilan avec ses colonnes **Brut / Amort / Net**. `STORY-062` produit les
> notes d'immobilisations. Les valeurs viennent **de la balance**.

⇒ Si le client ne les a pas calculées ailleurs — dans Sage, ou dans un tableur — **elles n'existent
pas**. Le produit affiche trois colonnes dont il ne produit aucune.

⚡ **Pour un expert-comptable, c'est le manque le plus visible après les tiers et le lettrage** : une
dotation aux amortissements est un **calcul d'arrêté**, pas une donnée reprise. C'est ce qu'on fait
en décembre, et le produit ne sait pas le faire.

⚠️ Le module concerne **les quatre verticales** (ExpCo, Distributeur, IMF, Assurance) — un
distributeur amortit ses véhicules, une IMF ses agences, un assureur ses immeubles de placement.

## Critères d'acceptation

- [ ] AC-1 — Une immobilisation : désignation, **compte du référentiel du dossier** (AD-8 de la
      doctrine STORY-422), date d'acquisition, **date de mise en service**, valeur d'origine,
      **valeur résiduelle**, durée d'utilité, mode d'amortissement.
- [ ] AC-2 — ⚠️ **La date de mise en service, pas la date d'acquisition**, ouvre l'amortissement.
      Les confondre est l'erreur la plus fréquente et elle décale toute la première dotation.
- [ ] AC-3 — Le registre appartient à un **dossier** et à un **exercice** ; aucune écriture sur
      exercice clos.
- [ ] AC-4 — Les **mouvements** sont des événements (acquisition, mise en service, cession, mise au
      rebut, réévaluation) : le registre est **append-only**, comme le portefeuille et le stock.
- [ ] AC-5 — La devise vient du contrat canonique (STORY-489) — **aucune constante XOF**.
- [ ] AC-6 — ⛔ Le registre **ne publie encore rien** en balance : c'est STORY-528. Le livrer sans
      articulation serait un second endroit où l'amortissement existe sans se rejoindre.

---

# Cadrage — fait AVANT toute ligne de code

Sources lues : `cadrage-immobilisations-2026-08-16.md` (§5, arbitrages PO), §6.2 et §8 de
`analyse-scalabilite-multireferentiel-2026-08-27.md`, le code de `balance-service` (`dev` @ `4926c62`)
et celui de `dossier-service` pour les bornes d'exercice, les quatre référentiels packagés, et le
texte AUDCIF 2017 relayé par le fonctionnement du compte 28 du SYSCOHADA révisé.

## Les constats mesurés

### M1 — Le service est tranché depuis le 16/08 : `balance-service`

L'en-tête disait « à confirmer au cadrage ». C'est fait depuis l'arbitrage PO n° 3 du 2026-08-16 :
**`balance-service`, pas de nouveau service**. Rien depuis ne l'a rouvert. Le module s'appelle
`immobilisations` et vit à côté de `creances-dettes-devises` (STORY-495), le registre dont il reprend
la forme : scopé au dossier, compte validé contre le plan **du dossier**, devise lue à l'accesseur
unique, exercice clos refusé.

### M2 — ⛔ L'arbitrage n° 1 du 16/08 est CADUC, et il faut l'écrire

Le 16/08, le PO a tranché « **contrôleur d'abord** — Prospera ne tient **aucune fiche** », et le §5
en tirait « aucune contribution à la balance ». Le 27/08, le même PO a **sorti le module du cadrage**
avec EPIC-135 = STORY-526 / 527 / 528 **telles que rédigées** : un **registre** (AC-4 ici), un moteur
de dotations (527) et leur publication **en balance** (528). La décision postérieure l'emporte.

⚠️ Écrit ici parce que la note du 16/08 est toujours au dépôt et qu'un relecteur qui la lit en premier
opposera l'arbitrage n° 1 à cette story. Il ne tient plus.

### M3 — La durée FISCALE n'est pas dans l'AC-1

L'arbitrage n° 2 du 16/08 (« **les deux durées**, économique et fiscale ») n'a pas été repris par
l'AC-1, qui ne porte **qu'une** durée d'utilité. L'écart économique ↔ fiscal est l'amortissement
**dérogatoire** — il alimente le code `11` du résultat fiscal (STORY-091), saisi et justifié à la main
aujourd'hui. **Hors périmètre, fiché** : ajouter une seconde durée sans le moteur qui la consomme
serait une donnée que personne ne lit.

### M4 — ⚡⚡ Aucun référentiel ne dit quels comptes sont des immobilisations amortissables

Mesuré sur les quatre artefacts packagés dans `balance-service` :

| Référentiel | Où sont les immobilisations | Ce que porte la classe 2 |
|---|---|---|
| `syscohada-revise@2.1` | `21` à `27`, amortissements `28` | les immobilisations |
| `smt-togo@1.0` | poste `AC1` : `21`…`27` | les immobilisations |
| `sfd-bceao@2.0` | poste `BA4` « Valeurs immobilisées » : **`41` à `44`** | ⛔ les **crédits à la clientèle** (`20`, `29`) |
| `cima-assurances@5.0` | poste `CA1` : `20` à `28` **mêlés** | placements (`23` valeurs mobilières…) **et** immobilisations |

Aucun ne déclare de correspondance « compte d'immobilisation → compte d'amortissement → compte de
dotation ». ⇒ Coder une racine (`2`, `21-24`…) serait **faux sur deux plans sur quatre** : une IMF ne
pourrait pas inscrire son agence (`42`), et ses crédits (`20`) passeraient. C'est le patron exact de
STORY-521 — *un numéro de compte ne qualifie rien hors de son plan*.

**L'AC-1 est donc tenu au sens d'AD-8, et seulement à ce sens** : le compte est un **compte de détail
du plan DU DOSSIER**, résolu à la date d'acquisition (`chargerReferentiel(orgId, dossierId, date)` →
`isCompteDeDetail`, l'accesseur de STORY-422 et STORY-495). La qualification « immobilisation
amortissable » et la correspondance vers `28x`/`681x` sont **l'objet de STORY-528**, qui en a besoin
pour écrire en balance et qui touchera les artefacts partagés à l'octet avec `bilan-service` — fiché.

### M5 — L'exercice est celui du DOSSIER, et ses bornes sont libres

Mesuré dans `dossier-service` (`bornes-exercice.util.ts`, `exercices.service.ts`) et le read-model de
`balance-service` (`exercices_dossier`, STORY-355) :

- les bornes sont normalisées **à minuit UTC**, la fin est **incluse** (un exercice du 1ᵉʳ au 31
  janvier dure 31 jours) ;
- **aucune contrainte de durée** (un premier exercice de 9,5 mois est normal) ;
- **aucune contrainte de non-chevauchement** : l'index unique porte sur les bornes exactes, et
  l'invariant « un seul ouvert » ne dit rien de deux exercices qui se recouvrent.

⇒ Un mouvement se rattache à **l'exercice du dossier qui couvre sa date** — jamais à un exercice civil
déduit de l'année. Aucun exercice ne la couvre ⇒ refus ; **deux** la couvrent ⇒ refus (on ne choisit
pas) ; l'exercice est clos ⇒ `409 EXERCICE_CLOS`, via `ExercicesRepository.estClos` et son arbitrage
à deux écrivains (STORY-367) — jamais une seconde lecture du statut.

### M6 — ⚠️ Conséquence assumée : un registre EXISTANT ne se reprend pas ici

Un cabinet qui prend un client prend aussi ses immobilisations — acquises avant le premier exercice
que le dossier connaît, parfois sur un exercice `MIGRATION` clos. M5 les refuse : leur date n'est
couverte par aucun exercice **ouvert**. C'est voulu. Reprendre un registre exige le **cumul
d'amortissements antérieur** tenu par le précédent teneur de comptes, une donnée qu'aucun AC ne définit
et qu'aucun calcul ne peut reconstituer honnêtement. **Hors périmètre, fiché** — même conduite que les
parts sociales (STORY-499), qui refusent une souscription antérieure à tout exercice ouvert.

### M7 — Append-only sans correction = une faute de frappe DÉFINITIVE

L'AC-4 veut un registre append-only « comme le portefeuille ». Pris à la lettre, une valeur d'origine
mal saisie ne se corrigerait **jamais**. Le patron du dépôt existe déjà (STORY-499, AD-1) : *« une
erreur se corrige par une `ANNULATION`, qui s'ajoute »*. Il est repris (D-526-4), borné au seul geste
qui laisse l'état cohérent : annuler le **dernier** mouvement effectif.

### M8 — La devise : l'accesseur unique lit le profil de l'ORGANISATION

`BalanceService.deviseDuDossier(orgId)` — l'unique accesseur de la devise de tenue (D-409-3), celui
que STORY-495 réutilise — lit le **profil société de l'organisation**, pas le dossier. C'est la
désynchronisation qu'EPIC-136 (STORY-529) existe pour fermer. Ce module s'y branche **sans en créer un
second** (deux résolutions de la même règle finissent par diverger), refuse une devise non tenue
(`DEVISE_DOSSIER_NON_TENUE`, même refus que la balance) et **fige** la devise sur l'acquisition : une
relecture ultérieure du profil ne réinterprète jamais un montant déjà inscrit (patron STORY-409).

### M9 — Ce que le texte dit, et que le registre doit porter

AUDCIF 2017, fonctionnement du compte 28 : *« La date de début d'amortissement est la date à laquelle
l'actif immobilisé est en l'état et en lieu d'utilisation prévue par l'entité »* (AC-2) ; *« le
montant du bien amortissable s'entend de la différence entre le coût d'entrée d'un actif et sa valeur
résiduelle »* ; modes : linéaire, dégressif, unités de production, autre mode mieux adapté.
⇒ La valeur résiduelle est **strictement inférieure** à la valeur d'origine (sinon il n'y a rien à
amortir : ce n'est pas une immobilisation de ce registre) ; la date de mise en service ne précède
jamais l'acquisition ; le vocabulaire des modes est **fermé** aux deux que le moteur de STORY-527 sait
calculer — tout autre mode est refusé à la saisie, pas enregistré pour être approximé plus tard.

## Les décisions

**D-526-1 — Un document = un mouvement.** Collection `immobilisations_mouvements`. L'immobilisation
n'est **jamais** stockée comme une fiche modifiable : c'est une **projection** de ses mouvements,
recalculée à chaque lecture. Aucune route ne modifie ni ne supprime un document.

**D-526-2 — Six types de mouvement.**

| Type | Porte | Règle |
|---|---|---|
| `ACQUISITION` | la fiche : désignation, compte, date d'acquisition, valeur d'origine, valeur résiduelle, durée d'utilité (mois), mode, devise figée | crée l'immobilisation ; une seule |
| `MISE_EN_SERVICE` | la date | une seule ; jamais avant l'acquisition (AC-2) |
| `CESSION` | la date, le prix de cession | sortie ; terminale |
| `MISE_AU_REBUT` | la date | sortie ; terminale |
| `REEVALUATION` | la date, la valeur réévaluée | enregistrée ; son effet sur le plan n'est pas de 527 (hors périmètre) |
| `ANNULATION` | le mouvement annulé | D-526-4 |

Les mouvements effectifs sont **chronologiques** : une date antérieure au dernier mouvement effectif
est refusée. Rien après une sortie ; rien sur une immobilisation dont l'acquisition est annulée.

**D-526-3 — Concurrence par RANG, sans transaction.** Chaque mouvement porte son `rang` dans
l'immobilisation (1, 2, 3…), sous un **index unique** `{ immobilisationId, rang }`. Une écriture fondée
sur un état périmé — deux mises en service simultanées, une annulation doublée d'un clic — perd en
`E11000`, traduit en `409 CONFLIT_CONCURRENT`. Une requête écrit **un seul** document : la règle des
transactions multi-documents ne s'applique pas.

**D-526-4 — L'annulation, en dernier-entré-premier-sorti.** Seul le **dernier mouvement effectif**
s'annule, désigné explicitement par son identifiant ; annuler l'acquisition quand elle est seule annule
l'immobilisation. L'annulation se rattache à l'exercice **du mouvement annulé**, qui doit être ouvert :
défaire une écriture d'un exercice clos, c'est écrire sur lui.

**D-526-5 — L'exercice** est celui du dossier qui couvre la date (M5), résolu par une lecture unique du
read-model `exercices_dossier`, puis `estClos`. Il est **figé** sur le mouvement avec son identifiant
producteur.

**D-526-6 — Le compte** est un compte de détail du plan du dossier à la date d'acquisition (M4).

**D-526-7 — La devise** est lue par `deviseDuDossier`, bornée aux devises tenues, et figée (M8). Les
montants sont des **entiers en unités mineures** de l'échelle appliquée (STORY-489).

**D-526-8 — Deux modes, vocabulaire fermé** : `LINEAIRE`, `DEGRESSIF`. Le coefficient du dégressif
est l'affaire de STORY-527 (AC-1 de 527 : publié par le paquet, jamais codé).

**D-526-9 — Rien n'est publié** (AC-6) : aucune balance, aucun événement. `BalanceModule` n'est
importé que pour la devise.

## Hors périmètre — hooks inertes documentés

- **La publication en balance** et la correspondance compte d'immobilisation → amortissement →
  dotation : **STORY-528** (M4).
- **La reprise d'un registre existant** avec son cumul antérieur (M6).
- **La durée fiscale** et l'amortissement dérogatoire (M3).
- **Les immobilisations non amortissables** (terrains, immobilisations financières) : M9 les exclut
  de ce registre, qui ne tient que ce qui s'amortit.
- **L'effet d'une réévaluation sur le plan** : enregistrée ici, elle n'est pas calculée par 527.

## Notes

- Voir `cadrage-immobilisations-2026-08-16.md`, [[STORY-527]], [[STORY-528]], [[STORY-062]].

## Progress Tracking

- 2026-09-22 — branche `MNV-526` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-22 — **cadrage fait avant tout code** : 9 constats M1-M9, 9 décisions D-526-1 à 9. Le
  service est confirmé (M1), l'arbitrage n° 1 du 16/08 est déclaré caduc (M2), et l'AC-1 est tenu au
  sens d'AD-8 parce qu'**aucun des quatre référentiels ne qualifie un compte d'immobilisation** (M4).

- 2026-09-22 — branche `MNV-526` ouverte sur `balance-service` (depuis `origin/dev` @ `4926c62`), puis
  **développée** : commit `0cc3f48`.

### Ce qui est livré

| Fichier (`src/modules/immobilisations/`) | Rôle |
|---|---|
| `enums/immobilisations.enums.ts` | vocabulaires fermés : 6 types de mouvement, 2 modes, 5 statuts, motifs de refus |
| `schemas/mouvement-immobilisation.schema.ts` | `immobilisations_mouvements` : index unique `{ immobilisationId, rang }`, champs requis **par type**, crochets qui refusent toute réécriture (8 opérations + `save` d'un document existant) |
| `immobilisations.regles.ts` | le **pur** : exercice couvrant, mouvements effectifs, projection, transitions, cible d'annulation |
| `immobilisations.repository.ts` | accès données, `orgId` **et** `dossierId` dans chaque filtre, aucune méthode d'écriture hors l'insertion |
| `immobilisations.service.ts` | lit, décide par les règles, écrit **un** document, traduit l'`E11000` du rang en `409 CONFLIT_CONCURRENT` |
| `immobilisations.controller.ts` | 8 routes sous `dossiers/:dossierId/immobilisations` — 2 lectures, 6 écritures, **aucun** PUT/PATCH/DELETE |
| `balance/reprise/exercices.repository.ts` | `exercicesDuDossier` : les bornes réelles publiées par `dossier-service` |

**Deux défauts de ma propre rédaction, vus avant les tests** : la projection substituait des replis
silencieux (`mode ?? 'LINEAIRE'`, `valeurOrigine ?? 0`) — un mode perdu aurait été présenté comme
linéaire, une valeur perdue comme nulle. Remplacés par `present()`, qui **lève** sur une incohérence du
registre ; et `enregistreLe` était publié requis alors que le code le rendait conditionnel.

### Portes — mesurées dans cette session (job Portly `tmp_8dc58ba9`, sortie 0)

| Porte | Résultat |
|---|---|
| lint | 0 avertissement |
| build | OK |
| `test:cov` | **209 suites, 4 279 tests verts** — global 99,17 % instr. / 92,62 % branches / 98,59 % fonctions / 99,26 % lignes ; module `immobilisations` 100 / 88,46 / 100 / 100 |
| `test:e2e` | **30 suites, 1 120 tests verts** — dont `immobilisations.e2e-spec.ts` (37) et le filet OpenAPI étendu au contrôleur |

### Table de mutations — 20 mutations, 20 rouges

Deux premières passes **mesuraient à vide** (M3, M15 : `&& false` rend le corps inatteignable, TypeScript y
rétrécit les variables à `never` et la suite ne compile plus — « 0 total » n'est pas un rouge). Refaites
sous une forme que le compilateur ne rétrécit pas (`&& Number.NaN > 0`).

| Mutation | Ce qu'elle casse | Rougit |
|---|---|---|
| M1 | la fin d'exercice devient exclue (AC-3) | 2 tests |
| M2 | deux exercices chevauchants : le premier est pris (M5) | 2 |
| M3 | plus de chronologie : mise en service avant l'acquisition (AC-2) | 2 |
| M4 | chronologie stricte : le même jour refusé | 1 |
| M5 | la sortie cesse d'être terminale | 5 |
| M6 | seconde mise en service admise | 2 |
| M7 | annulation d'un mouvement du milieu (D-526-4) | 2 |
| M8 | un mouvement annulé reste effectif | 8 |
| M9 | valeur résiduelle égale à l'origine admise | 1 |
| M10 | gel lu sur l'année **civile** au lieu de l'exercice du dossier (AC-3) | 1 |
| M11 | annulation sur exercice clos admise | 1 |
| M12 | l'`E11000` du rang remonte en 500 (D-526-3) | 1 |
| M13 | devise codée `XOF` (AC-5) — rougit **parce que** la spec élargit les devises tenues à `XAF` | 1 |
| M14 | compte hors du plan du dossier admis (AC-1) | 1 |
| M15 | refus de transition ignorés par le service | 4 |
| M16 | `orgId` retiré du filtre de lecture (multi-tenant) | 1 |
| M17 | un document enregistré se ré-enregistre (AC-4) | 1 |
| M18 | `deleteOne` n'est plus intercepté (AC-4) | 1 |
| M19 | une cession sans prix devient persistable | 1 |
| M20 | un montant en chaîne converti en silence par `enableImplicitConversion` | 1 (e2e) |

⚠️ **Ce que ces tests ne prouvent pas** : l'index unique réel, les crochets sur Mongo réel, la
persistance. C'est la vérification docker, faite **une fois**, sur l'état final après les revues, avec
STORY-527 (même module).
