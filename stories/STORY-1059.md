# STORY-1059 : la facture juste (1) — une facture émise ouvre sa Créance dans `paiement`, de façon idempotente

Status: in-progress

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
- [ ] Annonce « ⚠ Contrats » fusionnée avant le code (manifestes `commande` et `facturation` amendés, C5).
- [ ] `ventes` : branche `MNV-1059`, code, preuves Node 24, PR fusionnée en rebase.
- [ ] Verrou Docker (tenu par B, STORY-968, à 22:12 au rituel) : rejeu de `terrain` (reste de 1058) puis pile de 1059 avec
  le vrai `paiement` d'`origin/dev`, puis rejeu sur l'image de `ventes` reconstruite depuis `origin/dev`.
- [ ] PR de docs finale (fiche, tracker, fiche 1058 complétée, journal, passation à Dev A).

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

*(à compléter)*

## Preuves

*(à compléter)*

## Ce qui reste (la facture juste (2))

- La facture par livraison (`commande.bon-livraison.livre@1`, `<livraisonId>:facture`, quantité facturée par ligne de
  bon, `QUANTITE_DEJA_FACTUREE`), le reliquat, la facture `SANS_BON` ; l'option « dès la validation » en paramètre figé
  par commande.
- Mentions légales (A-1), PDF déterministe et son empreinte, envoi (lien public, AD-33), avoir, proforma, marge.
- `PARTIELLE` et `PAYEE` lus de `paiement.creance.changed@1` ; la balance clients et la balance âgée.
- Le branchement de la source de l'encours sur l'état publié de `paiement` ; `paiement.credit-tiers.changed@1` (B).
- L'initialisation de la série depuis Sage (EPIC-244) ; les routes C13 de `facturation` ; la facture du freelance.
