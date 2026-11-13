# Arbitrages sur les relectures de la spine du distributeur (2026-11-13)

Pris par l'assembleur sur délégation du PO (« on va sur tes recommandations »). Ils font foi pour la correction de la spine. Les arbitrages Q-1 à Q-4 du `.memlog.md` doivent aussi être portés dans la spine.

## Chaîne de vente et stock

- **Livraison partielle (K-3).** Chaque livraison a un `livraisonId`. La facture se fait **par livraison**, sur les quantités servies de cette livraison ; chaque ligne de bon tient sa **quantité facturée** ; un reliquat est une **nouvelle livraison** ; facturer au-delà du servi est refusé (`QUANTITE_DEJA_FACTUREE`). Clé d'idempotence de la facture : `livraisonId`.
- **Une seule confirmation de livraison (K-4).** La clé de confirmation est le `livraisonId`, jamais la clé de l'appareil ; une seconde confirmation (appareil puis bureau) est un no-op idempotent, ou un écart si les quantités diffèrent.
- **Stock (K-5).** La réservation se fait **par ligne de bon** ; la sortie **référence les réservations** qu'elle consume ; le non servi est **libéré par `stock`** à la confirmation de la livraison ; un retour est une entrée qui référence la facture ou l'avoir. `stock` est seul écrivain des mouvements.
- **Pas de transaction entre services (H-2).** « Une seule transaction » est remplacée par une **saga** : le bon naît `EN_ATTENTE_RESERVATION`, `stock` réserve et publie ; échec = le bon reste en attente avec un motif, rien n'est perdu ; une réservation sans bon vivant est **libérée par `stock` après un délai** (paramètre).

## Argent

- **Encours unique (C-1, K-1, K-2).** Une seule fonction d'encours (bibliothèque de `prospera-plateforme`), la même partout, `recouvrement` compris : créances + commandes validées non facturées − crédit du tiers. `recouvrement` reçoit `commande.engagement-tiers.changed@1` (catalogue AD-20 et `enrichiPar` du manifeste `recouvrement` à amender). L'engagement d'une commande ne baisse **qu'à la réception du fait de Créance** de la facture correspondante (jamais avant) : pendant la fenêtre, on compte deux fois (plus prudent), jamais zéro fois.
- **Clé de la Créance (K-7).** Une Créance est identifiée par `(source, sourceId)`, où `sourceId` est l'identifiant **interne** de la facture, jamais son numéro d'affichage.
- **Prix du freelance (C-3, K-6).** Tout montant au prix freelance ne circule que sur des **topics de périmètre freelance** distincts (`paiement.creance-freelance.changed@1`, avoirs, séries, audit), protégés par **ACL Kafka par service** ; les consommateurs côté société (`recouvrement`, `pdv`, `dashboard`) ne reçoivent que des faits au prix société. L'audit ne montre le prix freelance qu'aux rôles qui y ont droit.
- **Aucune perte de numéro ni d'argent (C-2, NFR-1).** Hébergé chez Money Vibes : **écriture majoritaire synchrone** (jeu de répliques MongoDB, `w: majority`) pour les séries, factures, avoirs, bons, encaissements et compteurs ; **RPO 0** pour ces données, 1 h pour le reste. Après une restauration, un compteur reprend au **maximum connu** (réplique, tête ancrée, numéros vus ailleurs) ; un numéro n'est jamais réémis ; un trou éventuel est déclaré et documenté. Ce point sort du Deferred.
- **Jours de retard (H-4).** Le fait `paiement.creance.changed@1` porte la **date d'échéance** ; pour le distributeur, `recouvrement` calcule les jours de retard depuis l'échéance ; pour l'IMF, il les lit de `risque-par` (inchangé). Réglage par verticale de la source du retard.
- **Promesses.** Les promesses de paiement appartiennent à `recouvrement` (comme dans la spine microfinance) ; le module `promesses` déjà codé dans `paiement` est **migré** vers `recouvrement` (tâche d'épic), pas ratifié.

## Terrain et exploitation

- **Une seule application terrain (H-5).** Un seul ordre d'envoi (file par objet, dans l'ordre de création) ; l'encaissement d'espèces va à **`collecte`** si le module est installé (IMF), sinon à **`paiement`** (encaissement d'espèces avec remise de caisse) pour le distributeur.
- **Enveloppe hébergée (H-6).** Disponibilité cible 99,5 % sur les heures ouvrées du client ; RTO 4 h ; RPO comme ci-dessus ; clés des champs sensibles dans un **coffre de Money Vibes, par organisation** ; accès du support par **bris de glace** tracé et visible du client ; supervision des services par le moteur (AD-40) ; capacité dimensionnée par client (métriques au Deferred).
- **Lien public d'envoi de la facture.** Lien signé, **un seul document**, expire à **7 jours**, révocable, sans compte, servi par `facturation` derrière la passerelle publique ; chaque ouverture est journalisée.
- **Appareil perdu** : réglage par verticale (distributeur : transmettre puis effacer ; IMF : quarantaine).

## Versions (relecture des versions)

Flutter **3.50** (Dart 3.14, stable le 2026-11-11) ; générateur : **CLI officiel OpenAPI Generator 7.27.x, `dart-dio` + `built_value`**, épinglé dans le build, après un essai d'une demi-journée sur un point de synchronisation (`oneOf`) ; plan B `swagger_parser` ; pas de `json_serializable`/`freezed` avec `dart-dio`. Base locale : **drift 2.35.4**, `drift_flutter` 0.3.1 ; chiffrement local par **SQLite3MultipleCiphers** via `sqlite3` 3.x (pas `sqlcipher_flutter_libs`, obsolète). NestJS 11 et Mongoose 8 : **lignes de maintenance choisies** (alignées sur le code), migration vers 12/9 au Deferred. Redis : **7.2.x épinglé** (licence BSD) ; successeur (8.x AGPL ou Valkey) décidé au niveau de la spine du moteur. FedaPay : `fetch` natif, pas le SDK ; l'idempotence se fait côté `paiement`. Le Dockerfile de `paiement` (`node:20-slim`) passe à Node 24 : tâche de migration.
