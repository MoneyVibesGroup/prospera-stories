# STORY-1059 : la facture juste (1) — une facture émise ouvre sa Créance dans `paiement`, de façon idempotente

Status: done

**Épic :** EPIC-230 (la facturation : la facture juste) · **Dépôt :** `prospera-ventes-service` (modules `facturation`
et `commande`) ; `prospera-paiement-service` (groupe B) **lu seulement** · **Plage :** groupe D, n° 15 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4), dernière story du lot. **Dépend de :** B-963 (`paiement` `dev` 716059c, la
Créance (1)) et B-965 (`dev` 96c385f → ad35786, `paiement.creance.changed@1`), fusionnées ; STORY-1056 (la commande (1)),
STORY-1052 (les séries), STORY-1049 (les garde-fous, `ENCOURS_NON_INSTALLE`), STORY-1053 (droits et portée).

**Sources :** PRD distributeur FR-42 (la facture depuis la commande, en un clic), FR-43 (numéro continu), FR-45
(montants exacts), FR-49, FR-52, FR-247 (la Créance tenue par `paiement`) ; spine distributeur AD-3, AD-4, AD-5, AD-6,
AD-7, AD-9, AD-20, AD-22, AD-29, AD-30, AD-34 ; manifestes `facturation` (M09) et `commande` ; catalogue
`contrats-distributeur-v1` ; fiches STORY-963 et 965 (B : `PUT /api/v1/creances/sources/FACTURE/{factureId}`, état
absolu `paiement.creance.changed@1`, crédit du tiers = trop-perçu) ; journal de B (« → D », D-1059 débloquée).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel, lecture (plan, règles, journaux de B et D, épic, spine, fiches 963, 965, 1047, 1049, 1056, 1058), fiche.
- [x] Annonce « ⚠ Contrats » fusionnée avant le code : prospera-stories **#666** (`main` `4fab607`), manifestes
  `commande` et `facturation` amendés (C5).
- [x] `ventes` : PR **#8** fusionnée en rebase (`dev` **1c1e944**, 101fbe8, **bd8d211**).
- [x] Verrou Docker : tenu par B (STORY-968) à 22:12 au rituel, libre à 22:37 ; **pris à 22:37**, une seule prise :
  rejeu de `terrain` (reste de 1058), preuves Node 24, mutations, pile avec le vrai `paiement` d'`origin/dev`, rejeu sur
  les images reconstruites depuis `origin/dev` ; **rendu à 23:29** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
- [x] PR de docs finale (fiche, tracker, fiche 1058 complétée, journal, passation à Dev A).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Une facture naît d'une commande `VALIDEE`** (tous ses bons `EMIS`), en un clic : `POST /api/v1/facturation/factures` `{ commandeId }`, `Idempotency-Key` exigée ; lignes au prix figé de la commande, HT, TVA par taux, TTC repris de la commande (AD-22) ; échéance figée à l'émission ; `facturation` n'importe aucun code de `commande` (il lit `commande.commande.chiffree@1`) | unitaires ; MongoDB réel ; pile |
| AC-2 | **Numéro `FAC-AAAA-NNNNNN`** tiré par `NumerotationDesSeries` dans la transaction de la facture (aucun numéro sans facture, aucune facture sans numéro, numéro unique en base) ; tête publiée `facturation.serie.changed@1` | MongoDB réel |
| AC-3 | **Idempotente** : la même clé rend la même facture ; une autre clé pour la même commande rend la facture existante ; **deux émissions concurrentes** de la même commande : une facture, un numéro | MongoDB réel (concurrence) ; pile |
| AC-4 | **La facture ouvre sa Créance dans `paiement`** : `PUT {PAIEMENT}/api/v1/creances/sources/FACTURE/{factureId}` (jeton du membre), après la transaction de la facture ; rejouée, **une seule Créance** (201 puis 200 chez `paiement`) | unitaires ; pile avec le vrai `paiement` (API relue) |
| AC-5 | **`paiement` indisponible** : la facture existe (201) et dit `A_OUVRIR` ; la Créance part au retour (relance automatique, rejeu de l'émission ou `POST …/factures/{id}/creance`), **sans doublon** | MongoDB réel ; pile (`paiement` arrêté puis relancé) |
| AC-6 | **`facturation.facture.emise@1`** publié dans la transaction de la facture (outbox), au catalogue, schéma au registre en BACKWARD — la charge que B attend pour son consommateur (AD-7) | unitaires (schéma) ; pile (fil Kafka) |
| AC-7 | **`paiement.creance.changed@1` projeté** dans `commande` : `commande_creances` (plus haute révision par Créance), `commande_credits_tiers` (trop-perçu), `commande_sources_encours` : **fin d'`ENCOURS_NON_INSTALLE`** dès que la source est projetée ; consommateur §1.9 (`createTopics` avant `subscribe`, `metadataMaxAge: 10_000`), supervisé par la santé | MongoDB réel ; pile |
| AC-8 | **L'engagement de la commande baisse à la réception de la Créance de sa facture** (AD-9), une fois, quel que soit l'ordre d'arrivée des faits ; une commande à crédit est jugée sur l'encours et le plafond refuse en 409 `PLAFOND_CREDIT_DEPASSE` quand il le faut | MongoDB réel ; pile |
| AC-9 | Chaque route neuve déclare son droit (invariant de 1053) et respecte la portée ; `facturation` ne porte aucun reste dû, encaissement ni statut payé (test de schéma, AD-6) | unitaires ; e2e |
| AC-10 | Node 24 (`verification`) : tsc, lint, build, unitaires, e2e, intégration ; mutations rouges sur l'assertion ; pile `grp-d` ; rejouée sur l'image reconstruite depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1059-1 — Le module `facturation` de `ventes` porte la facture.** AD-5 lui donne toutes les séries de documents
  fiscaux (`FAC-`), le manifeste M09 ses droits et ses faits. Ses routes C13 (déclarées, non servies, note de 1058)
  restent à faire : un `facturation` installé dans un essai laisserait le plan d'effacement `EN_COURS` (« Ce qui
  reste »).
- **D-1059-2 — Le déclencheur : une commande `VALIDEE`, en un clic, selon l'option « facturer dès la validation »
  d'AD-29.** La livraison (`entrepot`, EPIC-229) n'existe pas : la facture porte les quantités **commandées** de la
  commande (toutes réservées, tous les bons `EMIS`), ses prix figés, son `commandeId` et ses bons ; elle est marquée
  `DES_LA_VALIDATION`. Une facture par commande : clé d'origine `<commandeId>:facture` (AD-4), index unique. Le geste
  est une route (`POST /api/v1/facturation/factures`, FR-42), pas un consommateur automatique : la Créance s'ouvre avec
  le jeton du membre qui émet (B-963), qu'un consommateur n'a pas. Facturer depuis un bon (`<bonId>:facture`) ou une
  livraison (`<livraisonId>:facture`) vient avec « la facture juste (2) ».
- **D-1059-3 — `facturation` lit la commande par un fait : `commande.commande.chiffree@1`** (AD-3 : les montants sont
  sur ce fait, consommé par `facturation` ; il est au catalogue sous `commande`). `commande` le publie dans la
  transaction où la commande passe `VALIDEE` (à côté de `.validee`, sans prix) ; `facturation` le projette dans
  `facturation_commandes_chiffrees` (plus haut `rang` gardé). Sans projection : 409 `COMMANDE_NON_FACTURABLE`.
  Manifestes amendés (C5) : `commande` publie `commande.commande.chiffree@1` ; `facturation` le consomme.
- **D-1059-4 — Le numéro `FAC-AAAA-NNNNNN`**, série `factures` du module `facturation`, tiré par
  `NumerotationDesSeries.emettreDansUneTransaction` dans la transaction `majority` de la facture (comme `BL-`, D-1056-6) ;
  la tête part sur `facturation.serie.changed@1`. **La série démarre à 0 dans cette version** : la reprise du dernier
  numéro de Sage (`facturation.suite-numerotation@1`, refus `NUMEROTATION_NON_INITIALISEE`) vient avec EPIC-244 (Q-D-10
  au PO).
- **D-1059-5 — L'échéance est figée à l'émission** (AD-7) : jour d'émission (UTC, l'heure de Lomé) + le délai de
  règlement du point de vente, lu dans `facturation_conditions_reglement` (projection future de
  `pdv.point-de-vente.changed@1`, remplie par personne aujourd'hui, comme les read-models de 1056). Sans condition :
  409 `CONDITIONS_REGLEMENT_MANQUANTES` (AD-7), échec fermé.
- **D-1059-6 — La Créance s'ouvre par la route de B, synchrone et idempotente** : `PUT
  {PAIEMENT_SERVICE_URL}/api/v1/creances/sources/FACTURE/{factureId}` avec le jeton du membre (droit
  `paiement:demande:emettre`, dans le jeton), **après** la transaction de la facture (aucune transaction entre
  services, AD-34). Corps : `tiersId` (le point de vente), `perimetre`, `montantOrigineMineur` (le TTC), `devise`,
  `echeanceLe`, `libelle` (le numéro). `factureId` est l'identifiant interne (UUID), jamais le numéro.
- **D-1059-7 — `paiement` indisponible : la facture existe, la Créance est réessayée, sans doublon.** La facture rend 201
  avec `ouvertureDeLaCreance.etat = A_OUVRIR` et son motif (`PAIEMENT_INDISPONIBLE`, `DELAI_DEPASSE`,
  `PAIEMENT_NON_CONFIGURE`, `JETON_REFUSE`) ; trois chemins de reprise, tous sur la même clé `(FACTURE, factureId)` :
  (a) une relance automatique en mémoire, avec le jeton du membre tant qu'il est valide (recul 1 s → 30 s ; jamais
  écrit en base) ; (b) le rejeu de l'émission ; (c) `POST /api/v1/facturation/factures/{factureId}/creance`. Un refus
  définitif de `paiement` (400, 409 `CREANCE_SOURCE_EN_CONFLIT`, 422) met `REFUSEE` avec son code, sans relance. Le
  chemin durable d'AD-7 est le fait : `facturation.facture.emise@1` part dans la transaction de la facture ; quand le
  consommateur de B existera, une facture restée `A_OUVRIR` s'ouvrira sans membre (même clé, aucun doublon).
- **D-1059-8 — La charge de `facturation.facture.emise@1`** (pour le consommateur de B, D-965-9) : `factureId`
  (le `sourceId`), `numero`, `commandeId`, `livraisonId` (`null` en mode « dès la validation »), `tiersId`,
  `perimetre`, `devise`, `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur`, `echeanceLe`, `emiseLe`, `rang` ;
  clé `<organisationId>:<factureId>`. Écarts aux noms proposés par B : `montantTtcMineur` (et non `montantTTCMineur`,
  la graphie des faits de `ventes`).
- **D-1059-9 — La projection de la Créance dans `commande`** : un consommateur (groupe `ventes-service.creances`, depuis
  le début, §1.9, inscrit à la santé) lit `paiement.creance.changed` : `commande_creances` garde par `creanceId` la plus
  haute `revision` ; le crédit du tiers est le trop-perçu (`TROP_PERCU:<creanceId>`, même révision, `soldeMineur =
  tropPercuMineur`, consigne de B-965) ; **`commande_sources_encours` (créances et crédits du tiers) est posé pour
  l'organisation au premier fait projeté** : la commande à crédit n'est plus refusée `ENCOURS_NON_INSTALLE`, elle est
  jugée sur l'encours. Une organisation sans aucune Créance reste `ENCOURS_NON_INSTALLE` jusqu'à la première (vente au
  comptant facturée, ou reprise des factures ouvertes) ; brancher la source sur l'état publié de `paiement` vient avec
  (2).
- **D-1059-10 — L'engagement baisse à la réception de la Créance de la facture** (AD-9, jamais avant ; la fenêtre se
  compte deux fois). Le même consommateur lit aussi `facturation.facture.emise` (`commande_factures` : facture →
  commande, TTC) ; quand la facture **et** sa Créance (`FACTURE:<factureId>`) sont projetées, dans un ordre ou dans
  l'autre, l'engagement du `(tiers, périmètre)` baisse du TTC **une fois** (marque `engagementSolde`), dans une
  transaction qui publie son état absolu (`commande.engagement-tiers.changed@1`). Manifeste `commande` amendé : il
  consomme `facturation.facture.emise@1`.
- **D-1059-11 — Droits et portée** : émettre et relancer, `facturation:facture:emettre` ; lire,
  `facturation:facture:consulter`. La facture garde le nœud de sa commande : écriture hors portée 403 `HORS_PORTEE`,
  lecture hors portée 404 `FACTURE_INCONNUE`.
- **D-1059-12 — `facturation` ne tient aucun solde** (AD-6) : ni reste dû, ni encaissé, ni statut payé ; un test de
  schéma le garde. L'état de l'ouverture de la Créance n'est pas un état de paiement.

## Ce qui a été livré

**2026-11-17** — après l'annonce « ⚠ Contrats » (prospera-stories **#666**, `main` `4fab607`, avec les manifestes
`commande` et `facturation` amendés), une PR fusionnée en « Rebase and merge » :

- `prospera-ventes-service` **#8** (`dev` **`1c1e944`**, `101fbe8`, **`bd8d211`** ; branche `61f07d1`, `c611d6c`,
  `cee704a`, tête vérifiée `open` et égale au SHA poussé avant la fusion) :
  - `src/modules/facturation/factures/` : `Facture` (`facturation_factures`, index uniques clé, clé d'origine `<commandeId>:facture`,
    numéro), `CommandeChiffreeLue`, `ConditionDeReglementLue` ; `FacturesDuModule` (émission dans la transaction du
    numéro, rejeu, relance, lecture sous portée) ; `FacturesController` (trois routes, droits de la table d'accès) ;
    `faits.ts` (`FAC-AAAA-NNNNNN`, `facturation.facture.emise`, `facturation.serie.changed`) ;
  - `src/modules/facturation/creances/` : le port `OuvertureDeCreance` et son adaptateur HTTP (B-963) ;
    `OuverturesDesCreances` (issue notée sous condition, relance en mémoire bornée par l'expiration du jeton) ;
  - `src/modules/facturation/commandes-chiffrees/` : lecture et projection de `commande.commande.chiffree@1`, son
    consommateur (`ventes-service.commandes-chiffrees`) ;
  - `src/modules/commande/` : `faitCommandeChiffree` publié à la validation (`emission-des-bons.service.ts`) ;
    `credit/` (lecture de `paiement.creance.changed@1` et de `facturation.facture.emise@1`, `ProjectionDuCredit`,
    `ConsommateurDuCredit` sur `ventes-service.creances`, `commande_factures`) ; `commande_factures` au plan
    d'effacement C13 ;
  - `contrat/schemas/` : `commande.commande.chiffree.json`, `facturation.facture.emise.json`,
    `facturation.serie.changed.json` (modèles fermés) ; `topics.ts` (`FacturationTopic`) ; manifestes recopiés à
    l'octet (sources `4fab607`, empreintes dans `sources-des-manifestes.ts`) ; configuration (`PAIEMENT_SERVICE_URL`,
    `PAIEMENT_DELAI_MS`, `FACTURATION_RELANCE_CREANCE_MS`, deux groupes Kafka).
- **Écart à l'annonce** : `COMMANDE_INCONNUE` n'est pas émis par `facturation` : un `commandeId` mal formé rend la 400 de
  validation, une commande inconnue de `facturation` (ou pas encore validée) rend 409 `COMMANDE_NON_FACTURABLE`.

## Preuves

- **Node 24** (étage `verification`, export `git archive`) : `tsc` ; lint des fichiers touchés (`endOfLine auto`) ;
  build ; **unitaires : Test Suites: 52 passed, 52 total ; Tests: 506 passed** (444 avant) ; **e2e : 2/2 suites, 24
  tests** ; **intégration sur MongoDB 8 en jeu de répliques : 10/10 suites, 98 tests** (82 avant), dont
  `facturation.int-spec.ts` (16) : UJ-1 `FAC-2026-000001` (292 000 HT, 52 560 TVA, 344 560 TTC, échéance J+30), deux
  faits conformes au schéma, piste ; rejeu par la clé et par la commande sans numéro ni fait ni Créance de plus ;
  **dix émissions simultanées de la même commande : une facture, un numéro, une Créance** ; huit commandes en parallèle :
  huit numéros continus ; refus nommés sans écriture ; portée ; paiement en panne puis de retour (relance en mémoire,
  recul 1 s → 2 s) ; jeton expiré non gardé ; refus définitif `REFUSEE` ; une ouverture acquise jamais défaite (même par
  une tentative concurrente) ; **avant toute Créance `ENCOURS_NON_INSTALLE`, puis jugement sur l'encours et
  `PLAFOND_CREDIT_DEPASSE`** ; l'engagement baissé une fois dans les deux ordres et sous concurrence (5 + 5) ; trop-perçu
  à sa plus haute révision.
- **Mutations : 16/16 rouges sur une assertion** (clé d'origine par facture, numéro sur cinq chiffres, échéance sans
  délai, `tenter` qui rappelle paiement sur une facture ouverte, ouverture défaite par une tentative en panne, jeton
  expiré gardé, écriture concurrente prise pour un refus, révision égale qui réécrit, sources jamais branchées,
  engagement qui ne baisse pas, trop-perçu perdu, émission hors portée, `creanceId` incohérent lu, commande chiffrée
  incohérente lue, commande chiffrée non publiée, marge publiée). Quatre mutants d'abord équivalents ou qui ne
  compilaient pas ont été remplacés, avec des tests renforcés (voir « Pièges » du journal).
- **Karapace 6.2** sur la pile : `schemas:enregistrer` ⇒ 7 sujets (dont `commande.commande.chiffree-value`,
  `facturation.facture.emise-value`, `facturation.serie.changed-value`), `schemas:compatibilite` : compatibles BACKWARD.
- **Pile `grp-d`, image de la branche** (`runtime`), avec **le vrai `paiement` construit depuis `origin/dev` (`ad35786`)**,
  lancé, jamais modifié (MongoDB `rs-paiement` provisionné par ses scripts, Redis, `NODE_ENV=production`), Kafka,
  Karapace, émetteur de jetons RS256 (JWKS et doublure de `/moi/droits`), `INSTANCE_ESPACE=ESSAI`,
  `COMMANDE_RESERVATION_STOCK=recette` ; KYC et droits des modules publiés sur Kafka ; read-models posés à la main
  (points de vente, prix, plafonds, conditions de règlement), **aucune source d'encours** : **30/30**
  - commande à crédit avant toute Créance : 409 `ENCOURS_NON_INSTALLE` ;
  - vente au comptoir validée (`BL-2026-000001`, TTC 9 912), **facture `FAC-2026-000001`, Créance `OUVERTE` en 1,2 s**,
    relue **par l'API de `paiement`** (`GET /creances?source=FACTURE&sourceId=`) : une Créance de 9 912 XOF, tiers
    `PDV-COMPTOIR`, libellé `FAC-2026-000001` ;
  - rejeu (même clé, autre membre et autre clé) : la même facture ; la route de paiement rejouée à la main : 200 ;
    **toujours une Créance** ;
  - **huit émissions concurrentes** de la même commande : 8 × 201, une facture `FAC-2026-000002`, un seul non-rejeu, **une
    Créance** ;
  - **`paiement` arrêté** : facture `FAC-2026-000003` 201 `A_OUVRIR` (`PAIEMENT_INDISPONIBLE`), relue, deux tentatives ;
    `paiement` relancé : **la Créance s'ouvre seule 2 s après son retour** ; relance à la main ensuite : rien de plus ;
    **une Créance** ;
  - **`paiement.creance.changed` projeté** : 3 Créances dans `commande`, les deux sources branchées, l'engagement du
    comptoir revenu à 0 (trois factures soldées) ; **UJ-1 à crédit (344 560) jugé sur l'encours : `ACCEPTEE`, disponible
    après 655 440** ; sa facture `FAC-2026-000004` (échéance J+30) ; sa Créance projetée (344 560), l'engagement à 0 ;
    **700 000 de plus : 409 `PLAFOND_CREDIT_DEPASSE`** (encours certain 344 560, dépassement 44 560) ; 600 000 : 201 ;
  - outbox de `ventes` vidée (37 publiés) ; sur Kafka : 4 `facturation.facture.emise`, 4 `facturation.serie.changed`,
    5 `commande.commande.chiffree`, 4 `paiement.creance.changed` de l'organisation.
- **Rejeu sur les images reconstruites depuis `origin/dev`** (`bd8d211` : `runtime` `--no-cache` et `verification`), volumes neufs, même `paiement` d'`origin/dev` : **30/30**, puis **30/30** dans une seconde organisation ; sous Node 24 sur l'image d'`origin/dev` : unitaires **52/52 suites, 506**, e2e **2/2, 24**, intégration **10/10 suites, 98** ; **mutations 16/16** rejouées d'une traite ; Karapace : 7 sujets compatibles BACKWARD.
- `git diff --stat` = `--ignore-cr-at-eol` (34 fichiers) ; aucun `index.ts` non suivi ; `dist/` supprimé du checkout.
- **Reste de 1058 joué au passage** : `prospera-terrain-service` sur l'image d'`origin/dev` (`068e1c0`, `--no-cache`,
  volumes neufs) : **22/22**, Kodjo 14 visites au jour 0, espace réel 403 (fiche 1058).
- **Verrou Docker** : libre au rituel de la pile (B l'avait rendu après STORY-968) ; **pris à 22:37** (`D STORY-1059`),
  une seule prise pour le rejeu de `terrain`, les preuves Node 24, les mutations, la pile et son rejeu ; **rendu à
  23:29** ; aucun conteneur, volume ni réseau `grp-d` ne reste.

## La recette, pour la rejouer

Hors dépôt (aucun fichier de pile n'est versionné : le `docker-compose.yml` de `ventes` ne lève pas `paiement`) :

- **La pile** (`pile-1059.yml`, `docker compose -p grp-d`) : `ventes-service` (image de la branche ou d'`origin/dev`,
  `NODE_ENV=staging`, `LOG_PRETTY=false`, `INSTANCE_ESPACE=ESSAI`, `COMMANDE_RESERVATION_STOCK=recette`,
  `PAIEMENT_SERVICE_URL=http://paiement-service:3005`, `FACTURATION_RELANCE_CREANCE_MS=2000`), `mongo-ventes`
  (`rs0`) ; `paiement-service` (image `runtime` construite depuis `git -c core.autocrlf=false archive origin/dev` de
  `prospera-paiement-service`, `NODE_ENV=production`, `AUTH_SERVICE_URL=http://emetteur-de-test:8080/api/v1`, les
  variables de développement du compose racine), `mongo-paiement` (`mongo:8.0`, entrée
  `/provisionnement/demarrer-mongo-paiement.sh`, le dossier `mongo/` de l'export monté en lecture), `redis` ; `kafka`,
  `karapace` (6.2.0) ; `emetteur-de-test` (l'émetteur RS256 de 1053 : JWKS et doublure de `/moi/droits`).
- **Le pilote** (`recette-1059.py <organisation>`) : publie sur Kafka `entitlement.changed` (`commande`, `facturation`,
  `stock`, `paiement`), `kyc.status.changed` (`APPROVED`, pour `paiement`) et `reseau.portee.changed` (portées totales) ;
  pose dans `mongo-ventes` les points de vente, prix, plafonds et conditions de règlement, **sans source d'encours** ;
  signe des jetons à double audience (`ventes-service`, `paiement-service`) avec `perms: ['paiement:demande:emettre']`
  et les droits de tenant en `droitsHorsJetonDeRecette` ; joue les sept étapes et relit chaque Créance par
  `GET {paiement}/api/v1/creances?source=FACTURE&sourceId=` ; arrête et relance `paiement` par `docker stop/start`.
- Avant le pilote : `npm run schemas:enregistrer` depuis l'image `verification` sur le réseau de la pile
  (`SCHEMA_REGISTRY_URL=http://karapace:8081`), rejoué si Karapace répond 500 juste après `healthy`.

## Ce qui reste (la facture juste (2))

- La facture par livraison (`commande.bon-livraison.livre@1`, `<livraisonId>:facture`, quantité facturée par ligne de
  bon, `QUANTITE_DEJA_FACTUREE`), le reliquat, la facture `SANS_BON` ; l'option « dès la validation » en paramètre figé
  par commande.
- Mentions légales (A-1), PDF déterministe et son empreinte, envoi (lien public, AD-33), avoir, proforma, marge.
- `PARTIELLE` et `PAYEE` lus de `paiement.creance.changed@1` ; la balance clients et la balance âgée.
- Le branchement de la source de l'encours sur l'état publié de `paiement` ; `paiement.credit-tiers.changed@1` (B).
- L'initialisation de la série depuis Sage (EPIC-244) ; les routes C13 de `facturation` ; la facture du freelance.
