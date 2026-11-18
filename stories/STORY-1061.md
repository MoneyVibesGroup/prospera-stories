# STORY-1061 : la facture juste (2) — la suite de Sage reprise avant la première facture, le format du numéro, et le règlement de la facture lu chez `paiement`

Status: done

**Épic :** EPIC-230 (la facturation : la facture juste) ; FR-43 et FR-217 portés par EPIC-224 et EPIC-244 pour la
suite de numérotation · **Dépôt :** `prospera-ventes-service` (module `facturation`) ; `prospera-paiement-service`
(groupe B) **lu seulement** (son fait `paiement.creance.changed@1`) · **Plage :** groupe D, n° 2 du lot 4
(`PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4). **Dépend de :** STORY-1059 (la facture juste (1), `ventes` `dev` 1c1e944 →
bd8d211, recette `2453485`), livrée. **Suivante :** STORY-1062 🚚 (la commande (2)).

**Sources :** fiche STORY-1059 (« Ce qui reste ») et passation du journal de D (« Ce qui reste, dans l'ordre
conseillé », (1)) ; **réponse de l'utilisateur à Q-D-10** (2026-11-18, journal de A, « → D » : le choix par défaut tient —
la série démarre à 0 sans reprise — et **la reprise du dernier numéro de facture se pose avant la première facture d'un
client qui quitte Sage**, à la liste de mise en service) ; PRD distributeur FR-43 (« Le DAF peut déclarer à la bascule le
dernier numéro de facture émis sous Sage. La première facture Prospera porte le numéro suivant » ; format = paramètre :
préfixe, année optionnelle, largeur ; exemple `FAC-2026-0412` puis, le 01/02/2027, `FAC-2027-0413`), FR-217 (une fois ;
refus nommé après la première facture Prospera ; format repris du fichier Sage ; gel de Sage), FR-49 (`PARTIELLE`,
`PAYEE`, reste dû lu chez `paiement`, `EN_RETARD` à l'affichage le lendemain de l'échéance) ; spine distributeur AD-4,
AD-5, AD-6 (« `PARTIELLE` et `PAYEE` se déduisent de la Créance lue chez `paiement` »), AD-7, AD-20, AD-22, AD-27,
AD-30 ; manifeste `facturation` (M09 : droit `facturation:numerotation:administrer` « initialisation de la suite, une fois »,
objet de Reprise `facturation.suite-numerotation@1`, `paiement.creance.changed@1` consommé « de quoi déduire PARTIELLE et
PAYEE ») ; table d'accès d'`auth-service` (`facturation:numerotation:administrer` = `DAF`) ; schéma
`paiement.creance.changed` (B-965, `prospera-paiement-service` `dev` ad35786).

## Le découpage : ce que cette story prend, et pourquoi

La suite de la facture nommée en 1059 tient en sept sujets ; **la livraison n'existe pas encore** (elle vient avec
STORY-1062, la commande (2), et `entrepot`). Cette story prend les deux sujets qui ne la supposent pas et qui ne
demandent ni dépendance neuve ni geste d'un autre groupe :

1. **La suite de numérotation reprise de Sage, avant la première facture** (Q-D-10 répondue) : sans elle, la première
   facture d'un client qui quitte Sage partirait de 1 et la continuité exigée par FR-43 serait perdue pour toujours.
2. **Le règlement de la facture lu chez `paiement`** (`EMISE`, `PARTIELLE`, `PAYEE`, en retard) : le fait est publié
   par B depuis 965, et la facture n'affiche encore rien de ce qui est payé.

Le reste est écrit dans D-1061-12.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 4, règles, journaux de A, B, C, D (aucune demande neuve à D ; Q-D-10 répondue), fiches 1059 et
  1060, épic, spine, PRD, manifeste, table d'accès d'`auth`, schéma de `paiement.creance.changed`.
- [x] Annonce « ⚠ Contrats » fusionnée avant le code : prospera-stories **#689** (`main` `45cedbe`).
- [x] `ventes` : PR **#10** fusionnée en rebase (`dev` **`33bd0e7`**, `29b55a7`, `88d50d6`, `e1d370c`, **`68b293c`**).
- [x] Verrou Docker : libre au rituel ; **pris à 13:47**, une seule prise (Node 24, mutations, Karapace, `docker compose
  up`, pilote, rejeu depuis `origin/dev`) ; rendu (heure dans « Preuves ») ; aucun conteneur, volume ni réseau `grp-d`.
- [x] PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le DAF pose la suite de Sage** : `PUT /api/v1/facturation/numerotation/factures` (`facturation:numerotation:administrer`) `{ format: { prefixe, annee, separateur, largeur }, dernierNumero, gelLe }` ; le dernier numéro est lu dans son format (rang) ; le compteur `factures` est amorcé à ce rang, la suite écrite, `facturation.serie.changed@1` publié et la piste tracée **dans une seule transaction `majority`** | unitaires ; MongoDB réel ; pile |
| AC-2 | **La première facture suit Sage** : `FAC-2026-8821` repris ⇒ première facture `FAC-2026-8822` ; l'année est celle de l'émission, le compteur continu (`FAC-2026-0412` repris, émise le 01/02/2027 ⇒ `FAC-2027-0413`) ; sans reprise, rien ne change (`FAC-AAAA-NNNNNN` depuis 1, Q-D-10) | unitaires ; MongoDB réel ; pile |
| AC-3 | **Une fois, avant la première facture** : la même suite rejouée rend la même réponse (`rejeu`) ; une autre suite : 409 `SUITE_DEJA_REPRISE` ; après une facture émise par Prospera : 409 `NUMEROTATION_DEJA_ENGAGEE` ; une suite mal formée : 400 `SUITE_INVALIDE` (`details.erreurs`), rien d'écrit ; une pose et une première émission simultanées : jamais un numéro qui précède la suite ni une suite posée derrière un numéro émis | unitaires ; MongoDB réel (concurrence) ; pile |
| AC-4 | **La suite se lit** : `GET /api/v1/facturation/numerotation` rend, par série, le format, la reprise (dernier numéro, rang, gel, auteur), le dernier rang, l'époque, les trous déclarés et le prochain numéro | MongoDB réel ; pile |
| AC-5 | **Le règlement de la facture est lu chez `paiement`** : `paiement.creance.changed@1` (source `FACTURE`) est projeté dans `facturation` (plus haute révision par Créance ; groupe `ventes-service.reglements`, depuis le début, §1.9, supervisé par la santé) ; chaque facture rendue porte `reglement` : `INCONNU` avant le premier fait, `EMISE`, `PARTIELLE`, `PAYEE`, `CLOTUREE`, le reste dû (certain et affiché), l'encaissé, le déclaré, le trop-perçu, `enRetard` et `joursDeRetard` calculés à la lecture | unitaires ; MongoDB réel ; pile (faits sur Kafka) |
| AC-6 | **`facturation` ne tient toujours aucun solde** (AD-6) : le document de la facture n'a ni reste dû, ni encaissé, ni statut payé (test de schéma) ; le règlement vient du seul état absolu de `paiement`, jamais d'un calcul de `facturation` | unitaires |
| AC-7 | **Contrats** : `numero` de `facturation.facture.emise@1` et `prefixe` de `facturation.serie.changed@1` ne sont plus figés à `FAC-` (motif retiré, énumération retirée) ; **compatibles BACKWARD au registre** (Karapace, contre les versions enregistrées depuis `origin/dev`) ; le service garde son contrôle strict du format | Karapace ; unitaires |
| AC-8 | Chaque route neuve déclare son droit (invariant de 1053) ; Node 24 (`verification`) : tsc, lint des fichiers touchés, build, unitaires, e2e, intégration ; mutations rouges sur l'assertion ; `docker compose up` sain (module Nest changé, §1.5) ; rejoué depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1061-1 — La tranche : la suite de Sage et le règlement lu.** Voir « Le découpage ». La facture par livraison
  suppose la livraison (1062) ; les mentions légales attendent A-1 et vont avec le PDF qui les imprime ; l'avoir
  suppose que `paiement` consomme `facturation.avoir.emis@1` (B).
- **D-1061-2 — La suite se pose par une route du DAF, une fois, avant la première facture** (Q-D-10, FR-43 : « le DAF
  peut déclarer à la bascule le dernier numéro ») : `PUT /api/v1/facturation/numerotation/factures`, droit
  `facturation:numerotation:administrer` (manifeste M09, déjà donné au seul `DAF` par la table d'accès d'`auth` : rien à
  demander à B). Le corps porte les champs de l'objet de Reprise du manifeste (série par le chemin, format, dernier
  numéro, date de gel) : le point d'import de la Reprise (`facturation.suite-numerotation@1`, EPIC-244) appellera **le
  même geste** quand il existera. La clé d'origine est la série elle-même (une suite par série et par organisation,
  AD-4 « autre objet ») : pas d'`Idempotency-Key`, le rejeu se juge sur le contenu.
- **D-1061-3 — Le format est un paramètre de la série, posé avec la suite** : `prefixe` (1 à 12 caractères parmi
  lettres, chiffres, `/ . _ -`), `annee` (l'année de l'émission, en UTC = l'heure de Lomé), `separateur` (après l'année,
  0 à 3 caractères parmi `/ . _ -` ; vide sans année), `largeur` (1 à 12 ; au-delà, le rang s'allonge, il ne boucle
  pas). **Sans suite posée, le format reste celui de 1059** (`FAC-`, année, `-`, largeur 6) : la largeur par défaut de 4
  que cite FR-43 est celle d'une série reprise, et changer le défaut changerait les numéros déjà publiés.
- **D-1061-4 — Le dernier numéro se lit dans son format, ou la suite est refusée.** Il doit commencer par le préfixe,
  porter une année sur quatre chiffres si le format en a une (puis le séparateur), et un rang écrit sur au moins
  `largeur` chiffres, sans zéro de tête au-delà (forme canonique : `FAC-2026-08821` est refusé en largeur 4). Rang ≥ 1.
  `gelLe` (instant de bascule, ISO 8601) est exigé et n'est pas dans le futur ; le contrôle « aucun numéro Sage
  postérieur au gel » est un rapport de la Reprise (EPIC-244).
- **D-1061-5 — Une fois.** La même suite (même format, même dernier numéro, même gel) rejouée rend la première réponse
  (200, `rejeu: true`), même après des factures (AD-4 : le rejeu rend le premier résultat). Une autre suite : 409
  `SUITE_DEJA_REPRISE` (avec ce qui est posé), même avant la première facture (FR-217 : « l'initialisation n'a lieu
  qu'une fois ») ; une erreur de saisie se corrige hors de cette story (un geste du support, tracé). Une série déjà
  entamée par Prospera : 409 `NUMEROTATION_DEJA_ENGAGEE` (avec le dernier rang émis) ; aucun numéro n'est réécrit.
- **D-1061-6 — Une seule transaction `majority`** (AD-30) : le compteur est amorcé (`amorcer` de `series-v1.1`, sous la
  condition « série non entamée » de la bibliothèque), la suite écrite (index unique `(organisation, série)`), la tête
  publiée (`facturation.serie.changed@1`, `dernier` = le rang repris : une restauration ne redescend jamais sous lui) et la
  ligne de piste ajoutée, ou rien. Avec l'ancre (profil hébergé), le plancher est posé dans l'ancre **après**
  l'acquittement (un plancher posé pour une transaction rejouée puis refusée ferait sauter la série) ; s'il manque, la
  réconciliation du démarrage ancre la série au rang tenu. La bibliothèque n'est pas modifiée (copie à l'octet).
- **D-1061-7 — L'émission lit le format dans sa transaction.** Une pose et une première émission concurrentes écrivent le
  même document de série : l'une est rejouée par `withTransaction` et voit l'autre. Résultat : la facture suit la suite,
  ou la suite est refusée `NUMEROTATION_DEJA_ENGAGEE` ; jamais les deux à moitié.
- **D-1061-8 — Deux contrats relâchés, rien de renommé** (AD-27) : le motif `^FAC-[0-9]{4}-[0-9]{6,}$` de `numero`
  (`facturation.facture.emise@1`) et l'énumération `["FAC-"]` de `prefixe` (`facturation.serie.changed@1`) sont
  **retirés** (un motif élargi serait un motif changé, refusé par le registre ; un motif retiré accepte tout ce
  qu'acceptait l'ancien : BACKWARD). Le service garde le contrôle strict, par le format de la série. Vérifié au registre
  contre les versions enregistrées depuis `origin/dev`.
- **D-1061-9 — Le règlement est une lecture de `paiement`, pas un solde de `facturation`** (AD-6, AD-7, manifeste M09) :
  `facturation_creances_lues` garde, par facture, l'**état absolu** publié par `paiement` (plus haute `revision`, une
  révision égale ou plus ancienne n'écrase rien), jamais écrit par un geste de `facturation`, jamais additionné ni
  recalculé ; le document de la facture reste sans aucun champ d'argent reçu (test de schéma). Un fait d'une autre
  source que `FACTURE` est écarté. Groupe neuf `ventes-service.reglements` (depuis le début, §1.9), distinct de celui de
  `commande` (`ventes-service.creances`) : les deux modules lisent le même fait chacun chez soi (aucun import croisé).
- **D-1061-10 — Le statut du règlement** se déduit de l'état de la Créance : `INCONNU` tant qu'aucun fait n'est lu ;
  `CLOTUREE` si `paiement` l'a clôturée ; `PAYEE` si le reste dû certain est 0 ; `PARTIELLE` si un encaissement confirmé
  existe et qu'un reste dû demeure ; `EMISE` sinon. **Le déclaré ne fait jamais passer à `PAYEE`** (FR-104 : celui qui
  déclare ne confirme pas) : il est rendu à part (`declareMineur`, `resteDuAfficheMineur`). `enRetard` (et
  `joursDeRetard`) se calcule à la lecture, sur l'horloge de référence : le lendemain de l'échéance figée de la facture,
  avec un reste dû et une Créance ouverte (FR-49). Le trop-perçu est rendu (`tropPercuMineur`, le crédit du tiers de
  B-965). `ANNULEE_PAR_AVOIR` viendra avec l'avoir.
- **D-1061-11 — Lire la suite** (`GET /api/v1/facturation/numerotation`) demande `facturation:numerotation:administrer`
  ou `facturation:facture:consulter` (l'un suffit) : le comptable voit le prochain numéro sans pouvoir poser la suite.
- **D-1061-12 — Ce qui reste (la facture juste (3) et suivantes)**, dans l'ordre conseillé :
  1. **les mentions légales** (FR-44, liste de travail jusqu'à A-1 : un paramètre ; une mention manquante bloque
     l'émission `MENTION_OBLIGATOIRE_MANQUANTE`), **le PDF** déterministe et son empreinte (FR-46, AD-6 : asynchrone,
     `PDF_EN_ATTENTE`), **le lien public et l'envoi** (FR-47, AD-33, `notification`) ;
  2. **l'avoir** (`AV-`, `AVOIR_SUPERIEUR_A_LA_FACTURE`, `facturation.avoir.emis@1` ; demande à B pour son consommateur
     dans `paiement`) ;
  3. **la facture par livraison** après 1062 (`commande.bon-livraison.livre@1`, `<livraisonId>:facture`, quantité
     facturée par ligne de bon, `QUANTITE_DEJA_FACTUREE`, reliquat), le mode « dès la validation » figé par commande, la
     facture `SANS_BON` (taux de TVA du paquet fiscal) ;
  4. **la liste des factures** (filtres par statut de règlement, client, commande), la balance clients et la balance
     âgée (FR-50, FR-51 : des vues sur `facturation_creances_lues`, à une date, cinq tranches) ;
  5. les routes C13 de `facturation` ; l'objet de Reprise `facturation.suite-numerotation@1` (EPIC-244) branché sur la
     route de D-1061-2 ; `facturation.facture.changed@1` ; la proforma ; la facture du freelance.

- **D-1061-13 — Deux défauts trouvés par la preuve, corrigés dans la story ; le même défaut latent, ailleurs, reste
  nommé.** (1) Deux classes `@Schema` du même nom (`CreanceLue`, dans `commande` et dans `facturation`) partagent la
  connexion du service : l'une écrivait dans la collection de l'autre. La classe de `facturation` s'appelle
  `CreanceDeFactureLue` ; un invariant neuf (`src/modeles-uniques.invariant.spec.ts`) refuse tout nom de modèle déclaré
  deux fois. (2) Deux premiers états simultanés d'une même facture : l'upsert conditionnel de l'un heurtait la clé de
  l'autre et le plus récent était perdu (dix états concurrents : révision 6 gardée au lieu de 10, une fois sur trois) ;
  la clé dupliquée est rejouée et la révision tenue décide. **Le même motif** (clé dupliquée ⇒ « ignoré ») existe dans
  `commande` (`ProjectionDuCredit.plusHauteRevision`, 1059) et dans `CommandesChiffrees.appliquer` : sans effet tant
  qu'un seul consommateur lit une partition (les faits d'une Créance arrivent dans l'ordre), il est inscrit à « Ce qui
  reste » plutôt que changé sans preuve dans cette story.

## Ce qui a été livré

**2026-11-18** — après l'annonce « ⚠ Contrats » (prospera-stories **#689**, `main` `45cedbe`), une PR fusionnée en « Rebase
and merge » :

- `prospera-ventes-service` **#10** (`dev` **`33bd0e7`**, `29b55a7`, `88d50d6`, `e1d370c`, **`68b293c`** ; tête de la branche
  `56849a7` vérifiée `open` et égale au SHA poussé avant la fusion) :
  - `src/modules/facturation/numerotation/` : `format.ts` (format pur : mettre en forme, lire un numéro dans son format,
    défauts nommés), `schemas.ts` (`facturation_suites_numerotation`, index unique `(organisation, série)`),
    `suites.service.ts` (`SuitesDeNumerotation` : poser une fois, rejeu, refus, lecture, format lu dans la transaction de
    l'émission), `numerotation.controller.ts` (`GET /facturation/numerotation`, `PUT /facturation/numerotation/factures`) ;
  - `src/modules/facturation/reglements/` : `reglement.ts` (lecture pure de `paiement.creance.changed@1`, statut du
    règlement), `schemas.ts` (`facturation_creances_lues`, modèle `CreanceDeFactureLue`), `reglements.service.ts`
    (projection à la plus haute révision, consommateur `ventes-service.reglements`) ;
  - `factures.service.ts` : le numéro mis en forme par le format de la série, lu dans la transaction ; `reglement` dans
    toute facture rendue ; `faits.ts` : la tête porte le préfixe du format ;
  - `src/socle/series/numerotation.service.ts` : `amorcerDansUneTransaction` (bibliothèque `series-v1.1` inchangée) ;
  - `contrat/schemas/` : motif de `numero` et énumération de `prefixe` retirés ; configuration `KAFKA_REGLEMENTS_GROUP_ID` ;
  - `src/modeles-uniques.invariant.spec.ts` (D-1061-13) ;
  - **recette versionnée** : `scripts/recette/1061/` (`pile-1061.yml`, `emetteur-de-test.mjs`, `recette-1061.py`,
    `mutations-1061.mjs`, `README.md`).
- **Écart à l'annonce : aucun.** Le nom de modèle Mongoose `CreanceDeFactureLue` est interne (la collection annoncée,
  `facturation_creances_lues`, ne change pas).

## Preuves

- **Node 24** (étage `verification`, export `git -c core.autocrlf=false archive`) : `tsc` ; build ; lint de `src` et `test`
  (`endOfLine auto`) ; **unitaires : 55/55 suites, 569 tests** (506 avant) ; **e2e : 2/2, 24** ; **intégration sur MongoDB 8 en
  jeu de répliques : 11/11 suites, 123 tests** (98 avant), dont :
  - `facturation.int-spec.ts` (+18) : `FAC-2026-8821` repris ⇒ `FAC-2026-8822`, `8823`, têtes 8821 → 8823 conformes au
    schéma, piste `REPRISE_DE_LA_SUITE` puis `EMISSION` ; `FAC-2026-0412` repris, émise le 01/02/2027 ⇒ `FAC-2027-0413` ;
    `FA000123` ⇒ `FA000124` ; sans suite, `FAC-2026-000001` ; rejeu, `SUITE_DEJA_REPRISE` (dernier numéro, format, gel),
    `NUMEROTATION_DEJA_ENGAGEE` puis la série continue ; six suites invalides, chaque défaut nommé, rien d'écrit ; **dix
    poses simultanées** : une pose, neuf rejeux, une tête ; **six suites différentes en même temps** : une seule ;
    **une pose et la première émission simultanées** (huit organisations) : jamais à moitié ; **vingt factures en
    parallèle** : `8822` → `8841` ; le règlement `INCONNU` → `EMISE` → `PARTIELLE` → `PAYEE`, état ancien ou égal ignoré,
    déclaré à part, en retard le lendemain de l'échéance, **dix états concurrents dans le désordre : la révision 10** ;
  - `numerotation-http.int-spec.ts` (4, vraie chaîne de gardes, ancre dans une base à part) : 403 au comptable, 201 puis
    200 (rejeu), 400 `SUITE_INVALIDE` et champ inconnu, 409 `SUITE_DEJA_REPRISE`, **plancher 8821 posé dans l'ancre** et
    une émission ancrée qui suit sans trou ; une ancre entamée seule ⇒ `NUMEROTATION_DEJA_ENGAGEE`.
  - Les deux suites neuves jouées **cinq fois de suite** : 41/41 à chaque passage (après le correctif (2) de D-1061-13).
- **Mutations : 19/19 rouges sur une assertion** (9 pures, sous Node 25 puis Node 24 ; 10 sur MongoDB réel) — forme non
  canonique, séparateur, séparateur sans année, préfixe non échappé, le déclaré qui paie, retard le jour même, Créance
  clôturée en retard, autre source lue, `PARTIELLE` sur le déclaré ; révision égale qui réécrit, empreinte sans le gel,
  gel futur admis, préfixe perdu (pose, émission), série entamée prise pour une suite reprise, autre suite rendue en
  rejeu, émission qui ignore le format, ancre entamée ignorée, aucun plancher dans l'ancre. Une mutation qui ne compilait
  pas (paramètre inutilisé) a été réécrite. L'invariant des noms de modèles rougit sur le nom d'avant le correctif.
- **Karapace 6.2** sur la pile : les schémas d'`origin/dev` d'avant la story enregistrés d'abord, puis ceux de la story :
  `facturation.facture.emise-value` et `facturation.serie.changed-value` **compatibles BACKWARD** (motif et énumération
  retirés) ; **témoin** : un motif changé (`[0-9]{7,}`) est refusé `INCOMPATIBLE`.
- **Pile `grp-d`** (`scripts/recette/1061/pile-1061.yml`, image de la branche) : `docker compose up` sain (module Nest
  changé, §1.5) ; pilote **22/22** : 403 au comptable, `SUITE_INVALIDE` nommée, pose 201, rejeu 200, 409, lecture
  `FAC-2026-8822` ; factures `FAC-2026-8822`, `8823` ; règlement `EMISE` → `PARTIELLE` → `PAYEE` lu de faits publiés sur
  Kafka, un état ancien, une autre source et un message illisible sans effet, le déclaré ne paie pas, aucun solde dans le
  document ; sans reprise `FAC-2026-000001` puis `NUMEROTATION_DEJA_ENGAGEE` ; outbox vide ; têtes 8821, 8822, 8823 et
  factures lues sur Kafka.
- **Rejeu sur les images reconstruites depuis `origin/dev`** (`68b293c`, `--no-cache`, volumes neufs) : registre (base
  d'avant, puis la story : compatibles BACKWARD), pilote **22/22** ; sous Node 24 sur l’image d’`origin/dev` : unitaires **55/55 suites, 569**, e2e **2/2, 24**, intégration **11/11 suites, 123** ; **mutations 19/19** rejouées d’une traite (10 sur MongoDB réel, 9 pures).
- `git diff --stat` = `--ignore-cr-at-eol` à chaque commit ; aucun `index.ts` non suivi.
- **Verrou Docker** : libre au rituel ; **pris à 13:47** (`D STORY-1061`), une seule prise, **rendu à 15:07** après `down -v` ; aucun conteneur, volume ni réseau `grp-d` ne reste. Images de
  preuve (branche et `origin/dev`) reconstruites trois fois sous la même prise, après chaque correctif.
