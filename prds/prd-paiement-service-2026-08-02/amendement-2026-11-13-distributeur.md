# Amendement du 2026-11-13 : `paiement` pour le distributeur (source, topics, clé, échéance, promesses, hébergement)

**Statut : ✅ VALIDÉ par le PO le 2026-11-13** (il retient la proposition de l'assembleur, sans relecture de Dev A). À appliquer à `prd.md` et au manifeste de `paiement` quand les stories de `paiement` pour le distributeur seront écrites.

**Date :** 2026-11-13 · **Demandé par :** la spine du distributeur (`architecture/architecture-distributeur-2026-11-13/ARCHITECTURE-SPINE.md` : AD-7, AD-9, AD-10, AD-11, AD-16, AD-17, AD-20, AD-27, AD-29 à AD-31 ; `arbitrages-relectures-spine.md`) et le PRD distributeur (`prds/prd-distributeur-2026-11-12/prd.md`) · **Rédigé pour :** Dev A et Dev B, qui écriront les stories · **Ferme la question Q-2** de la spine du distributeur.

**Voisins :** l'amendement des Créances du distributeur (`amendement-2026-11-13-creances-distributeur.md`) fixe le fond (registre, crédit du tiers, versement) ; celui-ci fixe les **contrats** et les **migrations** que la spine en tire. Les amendements des échéances de prêt et des règlements de sinistres du même jour restent valables. Aucun ne contredit les autres.

---

## 1. Ce qui change dans `paiement`

### 1.1 Une source de Créance de plus : `RELEVE_VENTE_COMPTE`

- À la livraison confirmée d'une vente de freelance, `facturation` émet **deux pièces** des mêmes quantités : la facture du freelance et le **relevé de vente pour le compte** du freelance, numéroté `RVC-`, au prix de la société (HT, TVA, TTC).
- `facturation` publie le fait **`facturation.releve-vente.emis@1`**. `paiement` l'écoute et **ouvre la Créance** de source **`RELEVE_VENTE_COMPTE`** : tiers = le freelance, périmètre = la société.
- Un avoir de la société sur un `RVC-` **réduit** cette Créance. Un avoir du freelance à son détaillant ne la touche pas.
- Le montant d'origine est figé. Une divergence est une anomalie tracée, jamais un écrasement.

### 1.2 Des topics de périmètre freelance, distincts, et des ACL par service

- Tout montant au **prix du freelance** ne circule que sur des topics **distincts** : `paiement.creance-freelance.changed@1` et `paiement.encaissement-freelance.changed@1` (côté `paiement`) ; `facturation.facture-freelance.emise@1`, `.avoir-freelance.emis@1` et `.serie-freelance.changed@1` (côté `facturation`).
- Les noms sans suffixe (`paiement.creance.changed@1`, `paiement.encaissement.changed@1`) ne portent **jamais** une pièce au prix du freelance.
- Un champ **`perimetre`** (`SOCIETE` ou `FREELANCE:<id>`) est obligatoire sur la Créance, le crédit du tiers, l'encaissement et tout fait qui les relaie. **Une imputation ne franchit jamais un périmètre.**
- **ACL Kafka par service**, déclarées dans les manifestes (C5) et vérifiées par un test de câblage : seuls `paiement`, `facturation` et le service qui héberge `freelance` lisent la famille freelance. Les consommateurs de la société (`recouvrement`, `pdv`, `dashboard`, `equipe`, `controle-gestion`, `finance-transactions`, `marketing`) n'y sont pas abonnés.
- Le **test de fuite** de la spine (AD-31) parcourt tous les topics et toutes les réponses de lecture de `paiement` : zéro occurrence du prix du freelance.

### 1.3 La clé de Créance : `(source, sourceId)`

- Une Créance est identifiée par **`(source, sourceId)`**. Le `sourceId` est l'**identifiant interne** du document (la facture, l'avoir, le relevé), **jamais son numéro d'affichage**.
- Elle se range dans la référence existante : `referenceExterne = <source>:<sourceId>`, avec l'upsert idempotent actuel sur `(organisationId, moduleAppelant, referenceExterne)`. Le schéma ne change pas.
- Conséquence : un numéro corrigé, repris ou réémis après une restauration ne crée jamais une seconde Créance.

### 1.4 L'échéance dans `paiement.creance.changed@1`

- Le fait d'état absolu `paiement.creance.changed@1` porte **`echeanceLe`**, `montantExigible` (déclaré exclu : seul le confirmé réduit), `montantDeclare` (à part), `perimetre`, `livraisonId` et `lueLe`.
- `facturation` **fige l'échéance dans la facture** à l'émission (condition de règlement de `pdv`) et la porte dans `facturation.facture.emise@1`. `paiement` la **tient sans la recalculer**. Un changement de condition ne touche jamais une facture émise.
- `recouvrement` calcule les jours de retard depuis `echeanceLe`. L'imputation d'un encaissement est calculée **une fois** et rangée avec lui (`imputations`).

### 1.5 L'engagement d'une commande : libéré à la réception du fait de Créance

- `commande` tient l'engagement non facturé par `(tiers, perimetre)`. Il ne le baisse **qu'à la réception du fait de Créance** de la facture correspondante (`paiement.creance.changed@1`), **jamais avant**.
- Pendant la fenêtre entre la facture et la Créance, l'encours compte **deux fois** (plus prudent), jamais zéro. Un avoir ou l'annulation d'un reliquat baisse aussi l'engagement, sur son fait.
- La fonction d'encours est **unique** (`prospera-plateforme/encours`) ; `paiement` ne calcule aucun encours, il publie les entrées (`paiement.creance.changed@1`, `paiement.credit-tiers.changed@1`).
- La Créance reflète la facture en **moins de 5 secondes**. Aucun test ne suppose deux services « au même instant ».

### 1.6 Le module `promesses` migre vers `recouvrement`

- Le module `promesses`, codé dans `paiement`, est **migré** vers `recouvrement`, qui écrit la promesse. C'est une tâche d'épic, **sans perte** des promesses existantes. Il n'est pas ratifié.
- `paiement` ne garde que le **constat** : il publie `paiement.promesse.constatee` quand l'encaissement tient la promesse. `recouvrement` publie `recouvrement.promesse.changed@1`.
- Le module `points-de-vente` de `paiement` est documenté comme une **affiche de paiement**. Ce n'est jamais le `pdv` du réseau.

### 1.7 L'écriture majoritaire des encaissements sur un client hébergé

- Sur un client hébergé chez Money Vibes, `paiement` écrit les **encaissements** (et l'imputation, la Créance qui en dépend) en **`w: majority`** avec `j: true`, sur le jeu de répliques à trois membres du profil d'instance hébergée (spine du moteur, AD-43).
- **RPO 0** pour les encaissements. Aucun encaissement confirmé par PI-SPI ou FedaPay n'est perdu ; après une restauration, `paiement` **rapproche** ses encaissements avec le relevé du fournisseur.
- Une confirmation n'est remise (fait publié, reçu) qu'après l'acquittement de l'écriture.
- Chez un client qui a installé lui-même, le profil du moteur ne change pas (RPO 1 h) : le risque est écrit dans la spine du moteur (AD-43).

### 1.8 La plateforme : Node 24 et le client Kafka Confluent

- Le Dockerfile passe de `node:20-slim` à **Node 24** (spine du moteur, AD-42).
- `kafkajs` 2.2 (non maintenu) est remplacé par **`@confluentinc/kafka-javascript`**, avec Karapace (spine du moteur, AD-27) : tâche d'épic de `paiement`, sans changer le contenu des faits publiés.
- `paiement` lit les **deux graphies d'organisation** du code (`orgId`, `organizationId`, `organisationId`) tant que les consommateurs existants n'ont pas migré.
- NestJS 11 et Mongoose 8 restent (lignes de maintenance choisies) ; la migration vers 12 et 9 est hors février.

### 1.9 PI-SPI ET FedaPay, deux adaptateurs derrière le même port

- Les moyens sont **PI-SPI** (adaptateur `API_BUSINESS`) **et FedaPay** (adaptateur `fedapay`), plus espèces et virement déclarés. Tous passent par le port `PaymentProvider`. Le routage par pays, devise et méthode est de `paiement` ; désactiver l'un laisse l'autre actif, sans déploiement.
- **FedaPay** : l'API est appelée par **`fetch` natif** dans le code de `paiement`. Le SDK Node n'est pas introduit. Le webhook est vérifié par sa signature ; le secret est par mode (essai, réel).
- **Idempotence côté `paiement`** : aucune idempotence fournisseur n'est supposée. `paiement` déduplique lui-même (clé d'idempotence de l'ordre, rejeu sans effet) ; un doublon du fournisseur n'est jamais pris pour un second paiement.
- Aucun module du distributeur n'appelle un fournisseur : il demande un lien ou un ordre à `paiement`. En essai, la sortie réelle est interceptée d'abord.
- Les notifications entrantes d'une instance chez le client passent par le relais Money Vibes (spine du moteur, AD-44) ; `paiement` les consomme comme avant, une fois tirées.

## 2. Ce qui ne change pas

- `paiement` ne **détient aucun fonds** ; le ledger reste en ajout seul.
- La Créance reste **projetée par upsert idempotent** ; le schéma de la référence (`organisationId`, `moduleAppelant`, `referenceExterne`) est le même.
- Les faits **déjà codés** gardent leur graphie sans `@1` : `paiement.creance.materialisee`, `.soldee`, `.cloturee`, `paiement.encaissement.valide`, `.declare`, `.constate`, `.annule`, `paiement.promesse.constatee`.
- Les règles d'encaissement, de rattachement (FR-P38) et la validation par le comptable des paiements déclarés (FR-P31 à FR-P36).
- La séparation des tâches : celui qui déclare ne confirme pas ; un ordre sortant est préparé par l'un, validé par un autre.
- Un paiement déjà reçu n'est **jamais refusé** : l'excédent devient un crédit du tiers.
- Les amendements des échéances de prêt, des règlements de sinistres et des ordres de paiement : inchangés.
- Le contenu des faits publiés lors du passage au client Confluent.

## 3. Ce qui n'est pas dans cet amendement

- Le **décaissement Mobile Money sortant** par opérateur : à chiffrer au plan, puis amendement à part (voir les amendements des échéances de prêt et des règlements de sinistres).
- Le **relais** lui-même (réception, garde chiffrée, remise) : spine du moteur AD-44, propriétaire Dev A, à cadrer avant février.
- La **fonction d'encours**, les séries de numérotation et le calcul de la commission : `prospera-plateforme`, `facturation`, `freelance`.

## 4. Critères de recette

- Un `RVC-` émis ouvre une Créance de source `RELEVE_VENTE_COMPTE` au nom du freelance, périmètre société ; le même fait rejoué n'en ouvre pas une seconde.
- Une facture dont le numéro d'affichage est corrigé garde la même Créance (clé `(FACTURE, identifiant interne)`).
- Un consommateur de la société abonné par erreur à `paiement.creance-freelance.changed@1` est refusé par l'ACL ; le test de fuite ne trouve aucun prix du freelance sur les topics sans suffixe.
- Un encaissement du freelance ne s'impute jamais sur une Créance de la société, et inversement.
- `paiement.creance.changed@1` porte `echeanceLe` ; un changement de condition de règlement ne modifie pas une facture déjà émise.
- Plafond de 1 000 000, deux commandes de 600 000, une facture émise entre elles : même résultat quel que soit l'ordre d'arrivée des faits ; l'engagement ne baisse qu'à la réception du fait de Créance.
- Les promesses existantes sont toutes présentes dans `recouvrement` après la migration ; `paiement` publie encore le constat.
- Sur un client hébergé, un encaissement dont l'écriture majoritaire n'est pas acquittée n'est pas confirmé au client ; après restauration, le rapprochement avec le relevé du fournisseur ne trouve aucun encaissement perdu.
- Un webhook FedaPay à signature invalide est rejeté ; le même webhook reçu deux fois ne crée qu'un encaissement ; désactiver FedaPay laisse PI-SPI actif.
- Le service démarre sous Node 24 avec le client Confluent ; les faits publiés sont identiques à ceux d'avant.
