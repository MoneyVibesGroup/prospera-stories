# STORY-531 : Ce que « consolidation » veut dire ici — et ce qu'on refuse de promettre

Status: done

**Épic :** EPIC-136 — Multi-société et périmètre de groupe
**Service :** `bilan-service` (agrégation, journal de consolidation) + `dossier-service` (périmètre
arrêté, contrat `dossier.perimetre.arrete`) — ⚠️ **contrat d'événement = 2 dépôts** (cadrage, D-531-2)
**Points :** 13 *(le cadrage et l'agrégation ; les retraitements de consolidation sont chiffrés par EPIC-137→141)* · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-530** (le périmètre daté)
**Origine :** §6.3 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

« Consolidation » recouvre trois choses très différentes, et un cabinet qui demande « la
consolidation » ne demande presque jamais la troisième :

| Niveau | Ce que c'est | Coût |
|---|---|---|
| **① Agrégation** | additionner les balances du périmètre, poste à poste | faible — c'est du calcul sur des soldes existants |
| **② Agrégation + éliminations** | retirer les comptes réciproques (créances/dettes intra-groupe, achats/ventes intra-groupe) | moyen — exige d'**identifier** les opérations intra-groupe |
| **③ Consolidation SYSCOHADA complète** | retraitements d'homogénéisation, écarts d'acquisition, intérêts minoritaires, impôts différés, mise en équivalence | **très élevé — c'est un métier** |

⚡ **Le piège commercial est exact et connu :** un cabinet à qui l'on dit « nous consolidons »
comprend ③. Ce qu'un produit de production comptable livre en pratique est ① ou ②. **L'écart se
découvre au premier groupe réel.**

⚠️ C'est le **même patron** que le palier 1 / palier 2 de l'assurance, et il appelle la même
conduite : découper, livrer honnêtement le niveau bas, **nommer** ce qui n'est pas fait.

## ✅ ARBITRAGE PO — 2026-08-28 : **NIVEAU ③ — consolidation SYSCOHADA complète**

> « Je veux la partie 3. » — PO, 2026-08-28.

**C'est le niveau le plus exigeant des trois, et c'est le seul qui corresponde à ce qu'un cabinet
entend par « consolidation ».** L'arbitrage est donc cohérent avec la promesse — mais il change la
nature du lot, et il faut le dire :

⛔ **Le niveau ③ n'est pas une story, c'est un module.** Il ajoute sept traitements dont aucun ne se
déduit des balances : homogénéisation des méthodes comptables, éliminations des résultats internes,
écart de première consolidation et écart d'acquisition, intérêts minoritaires, impôts différés, mise
en équivalence, conversion des comptes des filiales étrangères.

⇒ **Plage réservée le 2026-08-28 : EPIC-137 → EPIC-141**, découpée en
[[STORY-541]] → [[STORY-548]]. **Cette story-ci garde le socle** : le cadrage, l'agrégation et les
contrôles de recomposition, sur lesquels tous les retraitements viennent se poser.

### ✅ Q2 tranchée avec : les éliminations sont **déclarées puis proposées**

Le produit ne peut pas deviner que le compte client de A est le compte fournisseur de B. Il peut le
**proposer** quand les montants concordent, et laisser l'humain confirmer — même doctrine que le
rapprochement bancaire : *un proposé n'a aucun effet tant qu'il n'est pas confirmé*.

### ⚠️ Ce que le niveau ③ exige et que le produit n'a pas encore

| Prérequis | État |
|---|---|
| Plusieurs sociétés par organisation | [[STORY-529]] — S20 |
| Périmètre daté, méthodes, % contrôle et % intérêt | [[STORY-530]] — S20 |
| **Devise au contrat de balance** | [[STORY-489]] — S20 · ⛔ **bloquant pour [[STORY-548]]** |
| **Bornes et durée d'exercice** | [[STORY-532]] — S20 · une filiale peut clôturer à une autre date |

---

## Ce qui devait être tranché — RÉSOLU le 2026-08-28, conservé pour la traçabilité

**Q1 — Quel niveau promet-on ?** Recommandation : **② agrégation avec éliminations**, et le dire.
① seul n'a presque aucune valeur pour un cabinet (un tableur le fait) ; ③ est un projet à part
entière qui n'a ni PRD ni cadrage.

**Q2 — Les éliminations sont-elles automatiques ou déclarées ?** Recommandation : **déclarées puis
proposées** — le produit ne peut pas deviner qu'un compte client de A est le compte fournisseur de
B ; il peut le proposer quand les montants concordent, et laisser l'humain confirmer. Même doctrine
que le rapprochement bancaire : *un proposé n'a aucun effet tant qu'il n'est pas confirmé*.

## Critères d'acceptation — le socle (agrégation et recomposition)

- [ ] AC-1 — L'agrégation additionne les balances **validées** des sociétés du périmètre **à la date
      retenue** (STORY-530 AC-3), en respectant leur **méthode** (globale = 100 %, proportionnelle =
      pourcentage).
- [ ] AC-2 — ⛔ **Toutes les sociétés du périmètre doivent partager le même référentiel et la même
      devise.** Sinon : refus explicite, jamais une addition silencieuse. C'est le mode de panne de
      STORY-489 appliqué à un groupe.
- [ ] AC-3 — Les **éliminations** sont tracées ligne à ligne, avec leur justification, et
      réversibles. Un état consolidé sans le détail de ses éliminations n'est pas auditable.
- [ ] AC-4 — ⛔ **Ce qui n'est PAS fait est nommé à l'écran** : écarts d'acquisition, intérêts
      minoritaires, impôts différés, retraitements d'homogénéisation. Doctrine FE-073.
- [ ] AC-5 — L'état produit porte **« agrégé »** ou **« consolidé »** selon ce qui a réellement été
      fait, jamais le mot le plus vendeur.

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017, articles 79 à 98**, lus verbatim (texte officiel, édition LegalRDC) ; le code de
`bilan-service` (`dev` @ `07dd791`) et de `dossier-service` (`dev` @ `bd0f71f`) ; les fiches STORY-381,
489, 490, 529, 530, 541 à 548 et `epics-consolidation-2026-08-28.md`.

## Les constats mesurés

### M1 — ⚡⚡ Aucune ligne de balance n'entre dans `bilan-service` par Kafka : les soldes n'y vivent que dans les liasses

Le read-model `balances_balance` ne porte que des **métadonnées** (« aucune ligne de balance n'entre ici,
jamais »). Les soldes arrivent par le **corps** de `POST …/bilan/etats` (`CreerJeuEtatsDto.soldesN`) ; la
provenance y est vérifiée (balance nommée, du dossier, `VALIDÉE`) mais les soldes ne sont rapprochés
d'aucune empreinte (STORY-381). Le seul état **figé** est le snapshot de validation (`snapshots_liasse`) :
soldes, référentiel (code, version, checksum), devise et exposant, provenance de balance, `version`,
`empreinte`.

⇒ « Les balances **validées** » de l'AC-1 ne peuvent être, dans ce service, que les **liasses figées** —
et c'est la lecture la plus forte : balance source `VALIDÉE` **et** soldes scellés par l'empreinte.

### M2 — Le périmètre n'est publié nulle part, et c'est à cette story de dire ce qu'elle reçoit

STORY-530 l'a écrit dans le code (`participations.service.ts`) : *« aucun consommateur du périmètre
n'existe […] C'est la consolidation (STORY-531) qui dira ce qu'elle doit recevoir. »* `bilan-service` n'a
aucun read-model de liens. Le calcul (tri topologique, fractions exactes, bornes de profondeur et de
volume, méthodes divergentes) vit dans `dossier-service`. Le **recopier** ferait deux moteurs qui
divergent ; l'**appeler** en HTTP romprait l'invariant n°2 (et `bilan-service` n'a aucun client HTTP).
Publier les liens bruts obligerait aussi à recopier le moteur. Reste à publier un **périmètre calculé** —
mais un périmètre est une fonction de la date : il se publie **arrêté à une date**, pas « en général ».

### M3 — Le texte tranche la méthode, le pourcentage et la date

- **Art. 80** : contrôle exclusif ⇒ intégration globale ; conjoint ⇒ proportionnelle ; influence notable
  ⇒ mise en équivalence.
- **Art. 81 al. 2** : *« Dans l'intégration proportionnelle, est substituée à la valeur comptable de ces
  titres la fraction représentative des intérêts de l'entité consolidante — ou des entités détentrices —
  dans les différents éléments actifs et passifs »*. Confirmé par l'art. 84 2° (*« la quote-part de l'entité
  ou des entités détentrices »*) et l'art. 85 1° c. ⇒ le pourcentage d'intégration proportionnelle est la
  **part de capital détenue par les détenteurs du groupe** — ni le % de contrôle, ni le % d'intérêt de la
  mère (qui chiffrera les minoritaires, STORY-544). Le périmètre de 530 le publie déjà : ce sont les
  `pctInteret` de ses **liens retenus** (les détenteurs sont, par construction, la mère ou une société
  contrôlée).
- **Art. 81 al. 3 / 85 2°** : la mise en équivalence ne reprend **qu'une ligne** — aucune agrégation poste à
  poste.
- **Art. 86** : l'élimination des comptes réciproques (6°) et des résultats internes (4°) est un traitement
  de consolidation, distinct de l'agrégation.
- **Art. 97** : *« La date de clôture des états financiers de l'entité mère et de ses filiales, utilisée
  pour la préparation des états financiers consolidés doit être la même »* ; dérogation si le décalage
  **n'excède pas trois mois**, avec ajustement des effets significatifs.
- **Art. 96** : toute exclusion doit être **justifiée en annexe**. **Art. 98** : une information manquante
  n'est pas une dispense, mais oblige à **signaler le caractère incomplet** des comptes.

### M4 — Le référentiel se résout par organisation, mais se FIGE par liasse

`resolveReferentielForOrg` lit l'habilitation de l'organisation (`409 REFERENTIEL_AMBIGU` au-delà d'un
référentiel) ; chaque liasse fige `referentiel { code, version }` et le checksum du paquet. Deux liasses
d'un même cabinet peuvent donc porter **deux versions** du même référentiel (`sfd-bceao` 1.0 et 2.0 sont
embarqués ; une habilitation change entre deux validations). L'hétérogénéité de référentiel est
**atteignable**.

### M5 — La devise se fige par liasse, et sa divergence est aujourd'hui inatteignable par HTTP

Chaque liasse fige `devise`, `exposant`, `deviseDeclaree` (STORY-490) ; `balance-service` n'accepte que
`XOF` (`DEVISES_SUPPORTEES`). Deux liasses de devises différentes ne peuvent pas exister aujourd'hui : le
refus de l'AC-2 sur la devise est une **garde latente** — elle se prouve en unitaire, pas en docker
(leçon de STORY-490). Une liasse antérieure à 490 se résout par `deviseDuDocument` (convention nommée).

### M6 — Les bornes d'exercice sont connues : l'art. 97 se vérifie

`exercices_dossier` (alimenté par `dossier.exercice.*`) porte `debut`, `fin`, `statut` de chaque exercice
de chaque dossier ; le jeu d'états porte son `exerciceId` (requis depuis STORY-381). « L'exercice de la
filiale qui clôture le même jour que celui de la mère » se trouve sans rien supposer.

### M7 — La portée d'un dossier, dans `bilan-service`, est l'organisation — mais les lectures sont figées sur le dossier du chemin

`DossierScopeGuard` résout le dossier **dans l'organisation du jeton** (404 sinon) ; il n'y a pas de
portefeuille par collaborateur dans ce service : agréger les liasses du groupe ne rend lisible rien qui
ne l'était déjà. Mais `DossierScopedRepository` **écrase** tout `dossierId` par celui du chemin : lire la
liasse d'une filiale exige une lecture **explicite**, cloisonnée par l'organisation, sur les dossiers que
le périmètre arrêté nomme.

### M8 — Les montants sont des entiers, et l'intégration proportionnelle produit des fractions

`LigneSolde { compte, soldeDebiteur, soldeCrediteur }` : entiers ≥ 0 en unités mineures ; les sommes
passent par `additionSure` (400 au-delà des entiers sûrs). `solde × p / 10 000` tombe entre deux unités :
arrondir ligne à ligne indépendamment **déséquilibre** la contribution d'une balance équilibrée (jusqu'à
une demi-unité par ligne).

### M9 — La plage 541 → 548 se pose sur un journal et une recomposition que personne ne livre

541 AC-2/AC-3 : chaque retraitement est *« une écriture de consolidation identifiée, réversible »*, dans
*« un journal de consolidation séparé, qui ne modifie jamais les comptes individuels »* ; 542 AC-7 : les
éliminations vont *« dans le journal de consolidation »* ; 548 AC-4 publie *« la somme des contributions
par entité égale chaque total consolidé »*. Le journal et la recomposition sont exactement **le socle sur
lequel tous les retraitements viennent se poser** — l'arbitrage PO les laisse ici.

### M10 — La Q2 a deux moitiés, et une seule est un socle

*« Déclarées puis proposées »* : la moitié **déclarée** est un geste humain — l'humain sait que le compte
client de A est le compte fournisseur de B — qui n'exige aucun moteur ; la moitié **proposée**
(rapprochement des montants), les **résultats internes**, le **prorata** en intégration proportionnelle et
l'**effet d'impôt** sont l'objet même de STORY-542.

## Les décisions

**D-531-1 — Le mot (AC-5).** L'état produit ici est une **balance agrégée** : `qualification: AGREGE`,
jamais `CONSOLIDE`. La qualification se calcule en **un seul point**, depuis la liste des traitements
(D-531-9) : `CONSOLIDE` exige que **tous** les traitements du niveau ③ soient appliqués. Aucun ne l'est
dans cette story ; 541 → 548 feront basculer leur ligne, pas la règle.

**D-531-2 — Le périmètre arrive ARRÊTÉ (M2) — contrat à 2 dépôts.** `dossier-service` :
`POST /dossiers/:dossierId/perimetre/arretes { date }` (`TENANT_ADMIN`) calcule le périmètre à la date
**par le calcul de STORY-530, importé** — sous le verrou de l'organisation, pour ne jamais photographier
une écriture de lien en cours — et le **fige** : `perimetres_arretes`, immuable, versionné par (mère,
date), journalisé sur la mère (`PERIMETRE_ARRETE`), publié par l'outbox sur **`dossier.perimetre.arrete`**
(énumération **propre**, jamais ajoutée à `DossierTopic` : ses consommateurs s'y abonneraient d'office).
`GET …/perimetre/arretes` en liste les métadonnées. `bilan-service` le projette en **insertion seule**
(read-model `perimetres_arretes`, idempotent). Rien n'est recalculé côté `bilan-service`, aucun appel HTTP.

**D-531-3 — Ce qui s'agrège : les liasses figées, à la même date de clôture (AC-1, M1, M6, art. 97).**
L'agrégat se demande pour un **exercice de la mère** (`exerciceId`). Pour la mère et chaque société
intégrée : l'exercice du dossier qui **clôture le même jour**, son jeu d'états **figé** (`VALIDE` ou
`DEPOSE`) et le **dernier snapshot** de ce jeu. Chaque source est **citée** (jeu, version, empreinte,
balance, version de balance). Jamais un solde reçu par la requête. Le périmètre retenu est le **dernier
arrêté à la date de clôture** de la mère. Absences — aucun périmètre arrêté à cette date, une société sans
exercice clôturant ce jour-là, sans jeu, ou dont le jeu est en brouillon — ⇒ `409` qui **nomme chaque
société en cause** (art. 98 : l'incomplet se signale, il ne s'additionne pas en silence).

**D-531-4 — Méthode et pourcentage d'intégration (AC-1, M3).** Intégration globale : **100 %**.
Proportionnelle : **somme des `pctInteret` des liens retenus** (art. 81 al. 2). Mise en équivalence : **non
intégrée**, nommée (STORY-546). `HORS_PERIMETRE` : non intégrée, nommée avec son fondement (art. 96).
Méthode divergente (`METHODES_DIVERGENTES`) : `409`, jamais une méthode choisie.

**D-531-5 — L'arrondi de l'intégration proportionnelle (M8).** Au **plus fort reste, colonne par colonne**
(débit, crédit) : chaque ligne reste à **moins d'une unité mineure** de sa valeur exacte, et la somme de
chaque colonne vaut l'arrondi (demi vers le haut) de la valeur exacte de la colonne — une balance
équilibrée donne une contribution **équilibrée**. Départage déterministe (compte, puis rang). Produits
calculés en entiers exacts (`bigint`). Prouvé par **balayage**, pas sur un jeu d'essai.

**D-531-6 — Homogénéité (AC-2, M4, M5).** Refus `409` si les liasses retenues n'ont pas le **même
référentiel (code ET version)** ou la **même devise (code ET exposant)** — chaque société nommée avec sa
valeur. Les dates de clôture divergentes sont refusées par construction (D-531-3), et le refus nomme la
dérogation de l'art. 97 comme **non traitée**.

**D-531-7 — Le journal de consolidation et les éliminations déclarées (AC-3, M9, M10).** Collection
`ecritures_consolidation`, rattachée à (mère, exercice de la mère), **séparée** des comptes individuels —
qui ne sont jamais touchés. Une écriture : nature `ELIMINATION`, origine `DECLAREE`, **justification
obligatoire**, lignes (société, compte, débit, crédit) **équilibrées**, numéro séquentiel, auteur et date.
**Réversible par annulation motivée** (`ANNULEE` : qui, quand, pourquoi) — jamais supprimée, jamais
réécrite. Les sociétés d'une ligne doivent être intégrées **globalement** (ou la mère) dans le dernier
périmètre arrêté : une société intégrée proportionnellement est refusée (le prorata des éliminations est
STORY-542 AC-6), comme une société mise en équivalence, exclue ou hors du groupe. Une écriture active
devenue hors périmètre (périmètre ré-arrêté) fait **refuser l'agrégat en la nommant** — jamais ignorée.
L'agrégat applique les écritures actives **ligne à ligne**, chacune citée avec sa justification.

**D-531-8 — Les contrôles de recomposition.** Publiés avec l'agrégat : **`RECOMPOSITION`** — pour chaque
compte, le solde agrégé égale la somme des contributions par société et des lignes d'élimination ; les
soldes sont calculés par un chemin **distinct** du détail publié, sinon le contrôle ne pourrait pas
échouer. **`EQUILIBRE`** — le déséquilibre de l'agrégat égale la somme des déséquilibres hérités des
liasses sources : l'agrégation et les éliminations n'en créent aucun.

**D-531-9 — Ce qui n'est pas fait est nommé (AC-4).** Liste fermée `traitements`, chacun avec son libellé
métier, sa raison et sa story : `AGREGATION` et `ELIMINATIONS_DECLAREES` **appliqués** ;
`HOMOGENEISATION` (541), `ELIMINATIONS_PROPOSEES` et `RESULTATS_INTERNES` (542),
`ECART_PREMIERE_CONSOLIDATION` (543), `INTERETS_MINORITAIRES` (544), `IMPOTS_DIFFERES` (545),
`MISE_EN_EQUIVALENCE` (546), `CONVERSION` (547), `ETATS_ET_NOTES_CONSOLIDES` (548) **non traités**.
L'écran les affiche (doctrine FE-073) : c'est le contrat qui les lui donne.

**D-531-10 — Routes et rôles.** `dossier-service` : `POST …/perimetre/arretes` `TENANT_ADMIN` (comme les
liens) ; `GET …/perimetre/arretes` à qui a la portée du dossier. `bilan-service`, sous
`@RequiresDossierScope()` et `@RequiresBilanAccess()` : `GET /dossiers/:dossierId/consolidation/exercices/
:exerciceId/agregat`, `GET|POST …/eliminations`, `POST …/eliminations/:ecritureId/annulation` —
`TENANT_ADMIN` et `TENANT_USER` (travail préparatoire, comme un brouillon de liasse ; chaque geste tracé).

**D-531-11 — Bornes (leçon de STORY-530 : une borne se mesure au pire cas admis).** Sociétés intégrées par
agrégat, lignes sources cumulées, écritures par consolidation, lignes par écriture, taille du message
d'arrêt : chacune bornée **sur mesure**, refus nommé au-delà — jamais une réponse tronquée.

## Hors périmètre — hooks inertes documentés

- **Les retraitements du niveau ③** (541 → 548) : la qualification `CONSOLIDE` n'est jamais produite ici ;
  la règle qui la produirait est posée et testée (D-531-1).
- **Ce qui reste des éliminations** (542) : proposition par rapprochement des montants, résultats
  internes, prorata en intégration proportionnelle, effet d'impôt différé, reprise pluriannuelle.
- **Le figement de l'agrégat** (version, empreinte, piste d'audit — 548 AC-6) et les **états agrégés**
  (Bilan, CR, TFT — 548 AC-1) : l'agrégat de cette story est **calculé à la lecture**, et cite les versions
  figées de ses sources.
- **Le comparatif N-1 agrégé** (548 AC-1) et la **variation de périmètre** en cours d'exercice (548 AC-3).
- **La dérogation de l'art. 97** (décalage de clôture ≤ 3 mois, avec ajustement).
- **L'écran** : une story frontale à ficher (liste des traitements non effectués, doctrine FE-073).

## Notes

- Voir [[STORY-529]], [[STORY-530]], `epics-assurance-2026-08-27.md` (le patron des deux paliers).

## Progress Tracking

- 2026-09-23 — branche `MNV-531` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-23 — **cadrage fait avant tout code** : 10 constats, 11 décisions. Les soldes n'existent dans
  `bilan-service` que dans les liasses — l'agrégat lit les liasses **figées** (M1) ; le périmètre n'est
  publié nulle part et se publie **arrêté à une date**, contrat à 2 dépôts (M2) ; l'art. 81 al. 2 fixe le
  pourcentage d'intégration proportionnelle à la part de capital des détenteurs (M3) ; l'art. 97 impose la
  même date de clôture, que les exercices répliqués permettent de vérifier (M6) ; le journal et la
  recomposition sont le socle de 541 → 548 (M9).
- 2026-09-23 — **dev `dossier-service`** (commit `23b7497`, branche `MNV-531`) : `POST
  /dossiers/:id/perimetre/arretes` (TENANT_ADMIN) — calcul sous le verrou de l'organisation, document
  `perimetres_arretes` immuable au schéma (mise à jour, remplacement, suppression et `save()` d'un
  existant refusés), version par (mère, date), journal `PERIMETRE_ARRETE` sur la mère, événement
  `dossier.perimetre.arrete` v1 dans l'outbox **sous la même session**, taille bornée (512 Kio mesurés).
  Portes : lint 0, build, `test:cov`, e2e 9 suites / 344 — **14 mutations, toutes rouges**.
- 2026-09-23 — **dev `bilan-service`** (commit `9e3b0e9`, branche `MNV-531`) : consommateur
  `dossier.perimetre.arrete` (group isolé `bilan-perimetre`), validation stricte **cohérence comprise**
  (méthode = celle de tous les liens retenus, `null` ⇔ liens divergents ⇔ UNE anomalie citant exactement
  ces liens, un lien retenu cité une fois, détenteurs = mère ou contrôlées, parts ≤ 100 %) — chaque règle
  recoupée avec le calcul du producteur (`perimetre.regles.ts`) pour ne jamais écarter un message qu'il
  émet ; `GET …/consolidation/exercices/:exerciceId/agregat`, journal `ecritures_consolidation`
  (déclaration, annulation motivée, garde de schéma : seul un `$set` de l'annulation vers `ANNULEE` passe).
  Portes : lint 0, build, `test:cov` 4 008 tests (99,12 / 95,36 / 99,4 / 99,21 ; fichiers neufs à 100 %
  de lignes, ≥ 92 % de branches), e2e 27 suites / 865.
- 2026-09-23 — **mutations `bilan-service`** : 62 menées en session (agrégation 11, plus fort reste 6,
  service 23, traitements 5, cohérence du périmètre + garde du journal 17), **toutes rouges** — dont deux
  après renforcement du test (tri multi-sociétés ; le test de coût, redimensionné sur le mutant
  quadratique). Les 57 mutations du sous-agent de tests : **15 rejouées indépendamment, toutes rouges**,
  dont la garde d'exhaustivité des codes qu'il n'avait pas pu éprouver.
- 2026-09-23 — ⚡ **deux écarts de production relevés par le sous-agent de tests, corrigés** : la garde du
  journal laissait passer `$set`/`$unset` de `createdAt`, un `$unset` du statut et un `$rename` entre champs
  d'annulation (elle raisonnait par champ, pas par opérateur) ; le consommateur acceptait des anomalies
  en double, citant des liens étrangers à leur société, et une méthode sans rapport avec ses liens.
- 2026-09-24 — **vérification docker sur stack NEUVE** (`down -v`), tout par les API réelles, 2 cabinets,
  **0 échec**. Ce qui a été discriminé :
  - le **contrat réel** : le consommateur strict accepte les messages du producteur réel (v1 et v2) et
    projette exactement ses sociétés (dossier, méthode, somme des parts) — une règle plus stricte que le
    producteur aurait laissé l'agrégat en `PERIMETRE_NON_ARRETE` ;
  - le **pipeline réel** sur Mongo 7 (dernier snapshot des jeux figés) et l'égalité de clôture de l'art. 97 ;
    `101000` = 1 000 000 + 500 000 + 50 % × 200 000 = 1 600 000,00, contrôles RECOMPOSITION et EQUILIBRE
    satisfaits, l'associée listée `MISE_EN_EQUIVALENCE_NON_TRAITEE` ;
  - le **journal** : l'élimination touchant l'IP refusée (`SOCIETE_NON_ELIMINABLE`) sans rien écrire ;
    l'élimination mère ↔ fille (n° 1) imputée ligne à ligne (− 5 000 000 sur les deux comptes, contrôles
    satisfaits), **empreintes des liasses identiques avant/après** ; l'annulation passe la garde de schéma
    sous la forme RÉELLE que Mongoose émet (horodatages compris), lignes inchangées, seconde annulation
    `409 ECRITURE_DEJA_ANNULEE`, agrégat revenu à 1 600 000,00 ;
  - la **version 2** du même jour retenue par l'agrégat ;
  - le **cloisonnement** : le cabinet B reçoit `404` sur l'agrégat, l'élimination et l'arrêté du cabinet A ;
  - la **persistance** : 2 arrêtés = 2 entrées `PERIMETRE_ARRETE` sur la mère (0 sur les sociétés) = 2
    événements `SENT`, aucun orphelin dans un sens ni dans l'autre ; 2 projections, 2 marqueurs
    d'idempotence ; une écriture, annulée ; rien chez B ;
  - le **démarrage dégradé** sur cluster vierge : le consommateur du périmètre, différé faute de topic,
    rejoint son group 5 s plus tard sans redémarrage (invariant n° 4).
  ⚠️ Un premier passage avait affiché des ✅ faux : bash 3.2 (macOS) développe les accolades `{a,b}` d'une
  chaîne citée DANS `"$(…)"`, et découpait les corps JSON en plusieurs arguments. Script corrigé (corps et
  requêtes en variables, `egal` refusant tout appel sans exactement 3 arguments), stack recréée, rejoué.
- 2026-09-24 — ⑤ branches poussées, **PR ouvertes ensemble** (contrat à 2 dépôts) : `prospera-dossier-service#35` (producteur) et `prospera-bilan-service#134` (consommateur), liées l'une à l'autre ; statut `in_progress` → `review`.
- 2026-09-24 — ⑥ **revue de code** (scan `opus` en deux tranches — contrat, consolidation — plus la lentille
  `ponytail-review` ; synthèse en session) : **9 constats, tous confirmés en session** (mutants rejoués :
  les 7 survivants annoncés survivaient bien), **1 bloquant**. Corrigés dans des commits dédiés
  (`dossier-service` `0759fd7`, `bilan-service` `412250b`) :
  - ⛔ **bloquant — `GET …/perimetre/arretes` n'avait pas été livrée**, alors que D-531-2 et D-531-10 la
    décident : livrée — métadonnées seules (identifiant, date, version, horodatage, effectifs ; jamais
    les sociétés figées), du plus récent au plus ancien, paginée avec les bornes du journal, ouverte à
    qui a la portée du dossier, 404 hors portée ;
  - **EQUILIBRE** lisait le déséquilibre hérité sur les contributions DÉJÀ mises à l'échelle — un arrondi
    ligne à ligne s'y serait retrouvé des deux côtés, contrôle vert : il se lit désormais sur les TOTAUX
    BRUTS de chaque liasse (chemin indépendant, M8), prouvé par le mutant « arrondi ligne à ligne » ;
  - `devise.source` publiait celle de la seule mère : c'est la plus faible du groupe ;
  - code de traitement `RAPPROCHEMENT_RECIPROQUES` → **`ELIMINATIONS_PROPOSEES`** (D-531-9) ;
  - la projection réécrivait `updatedAt` au rejeu (Mongoose ajoute `$set` à tout `updateOne`) :
    `timestamps: { updatedAt: false }`, prouvé sur le vrai schéma avec témoin ;
  - gardes manquantes ajoutées : export du repository et consommateur au graphe du module (retirer
    l'export laissait 4 008 tests verts et un service qui ne démarre pas), anomalie en double, détails du
    journal au rang 3 avec effectifs distincts, borne de lignes exacte ;
  - Swagger complété (`SOURCES_TROP_VOLUMINEUSES`, `DOSSIER_ID_INVALIDE`) ;
  - `ponytail` : deux simplifications retenues (une seule désignation des sociétés refusées,
    `trouver()` sur l'identifiant déjà validé) ; commentaires périmés corrigés.
  **21 mutations sur les correctifs, toutes rouges.** Portes rejouées : `dossier-service` lint 0,
  build, 1 708 unitaires (99,45 / 94,61 / 98,55 / 99,56), e2e 9 suites / 350 ; `bilan-service` lint 0,
  build, 4 013 unitaires (99,13 / 95,42 / 99,4 / 99,22), e2e 27 suites / 865.
- 2026-09-24 — ⑦ **revue de sécurité** (scan `opus` sur les deux PR analysées ensemble, synthèse en session) :
  **0 constat** de confiance ≥ 80 — IDOR, RBAC, anti-énumération, injection d'opérateur, message Kafka
  empoisonné (200 000 messages mutés, aucune exception, aucun motif ne recopie une valeur reçue),
  courses (numérotation, double annulation, arrêtés concurrents), immuabilité, bornes de volume.
  Deux points écartés, à arbitrer côté produit : dans `bilan-service` la portée d'un dossier est
  l'organisation (M7, antérieur à la story) — l'agrégat nomme donc des filiales qu'un TENANT_USER ne voit
  pas dans `dossier-service` ; le plafond de 200 écritures, annulées comprises (D-531-11), peut être
  épuisé par un abus interne attribué.
- 2026-09-24 — **vérification docker REJOUÉE sur l'état final** (stack neuve, `down -v`) : **0 échec** —
  tout le scénario précédent, plus la liste des arrêtés (pipeline réel `$size`, ordre, pagination,
  aucune société figée, 404 pour le cabinet B), les écarts hérités lus sur les totaux bruts (0, 0, 0),
  `devise.source` du groupe, `ELIMINATIONS_PROPOSEES` publié `NON_TRAITE` ; en base, les arrêtés projetés
  portent `createdAt` et **aucun** `updatedAt`. `docker compose stop` ensuite.
- 2026-09-24 — ⑧ `prospera-dossier-service#35` et `prospera-bilan-service#134` **rebase-mergées ensemble**
  sur `dev` (`53f0d40`, `149d343`), branches `MNV-531` supprimées. ⑨ statut `review` → **`done`** aux 3
  endroits, `completed_date: "2026-09-24"` ; notes de passage ajoutées à STORY-541 et STORY-542.
