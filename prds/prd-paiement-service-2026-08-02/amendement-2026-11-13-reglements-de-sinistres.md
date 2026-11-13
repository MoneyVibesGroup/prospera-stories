# Amendement du 2026-11-13 — les règlements de sinistres (paiements sortants)

**Statut : ✅ VALIDÉ par le PO le 2026-11-13 (le PO retient les recommandations du PRD Assurance).** À appliquer à `prd.md` quand les stories de `paiement` pour l'assurance seront écrites.

**Date :** 2026-11-13 · **Demandé par :** le PRD Assurance (`prds/prd-assurance-2026-11-13/prd.md`, FR-90 à FR-103, FR-220 à FR-225, FR-239 ; actions A-11 et A-19 ; annexe A) · **Rédigé pour :** Dev A et Dev B, qui écriront les stories.

---

## 1. Pourquoi un amendement

`paiement` encaisse. Il a aussi l'ordre sortant PI-SPI. Le PRD Assurance lui demande de **régler les sinistres** : des paiements **sortants**, vers une victime, des ayants droit, un garage ou un expert. Le module `sinistres` **ordonne** ; `paiement` **exécute** ou **enregistre**. Cet amendement dit ce que `paiement` ajoute. Il ne change pas les règles d'encaissement.

## 2. Ce qui change dans `paiement`

### 2.1 Le règlement de sinistre est un paiement sortant

- Un **règlement** naît d'un ordre publié par `sinistres` (`sinistres.reglement.ordonne@1`, un par règlement). Un dossier peut en avoir plusieurs : acompte, offre provisionnelle, plusieurs bénéficiaires, honoraires d'expert.
- Les **bénéficiaires** sont : la victime, les ayants droit, le garage, l'expert. Chaque règlement vise un seul bénéficiaire et un seul moyen.
- États du règlement : `A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`.
- La décision de régler et le droit de l'exécuter sont **distincts** : `paiement` n'exécute que ce que `sinistres` a ordonné.

### 2.2 Les moyens de règlement

- **Chèque : enregistré, pas exécuté.** La comptabilité saisit la banque, le numéro et le montant. `paiement` n'imprime pas et n'envoie rien : il tient l'état du chèque (émis, remis, en attente, en opposition) et le rapproche. Sans numéro, l'émission est refusée.
- **Virement et PI-SPI** : exécutés par `paiement`, avec l'ordre sortant existant. Un virement vers un compte que le schéma ne joint pas est préparé par `paiement` et exécuté par la comptabilité de la compagnie ; sa confirmation est saisie avec un justificatif et un second contrôle.
- **Mobile Money sortant (T-Money, Flooz).** `paiement` n'a **pas** d'adaptateur Mobile Money sortant. Il est **à chiffrer au plan**, puis à écrire dans un amendement à part (comme pour l'IMF). Tant qu'un opérateur n'a pas d'adaptateur sortant, son canal est **« bientôt »** pour ce pays : le dossier propose le chèque ou le virement, et **rien n'est simulé**. Les opérateurs sont paramétrables par pays.
- **Espèces** : un **plafond** (500 000 FCFA par défaut, paramètre). Au-delà, le règlement est refusé avec un code nommé et passe par un moyen traçable.

### 2.3 La clé d'idempotence par règlement

- Chaque règlement porte une **clé d'idempotence** unique, transmise à `paiement` et **gardée à chaque nouvelle tentative**. Le même ordre envoyé deux fois ne fait partir l'argent qu'une fois (FR-P19 à FR-P22 inchangés).
- `ECHEC` n'est posé que sur **refus explicite** du fournisseur. Il ne se relance qu'avec la **même clé**.

### 2.4 L'état INCONNU et le rapprochement

- Un règlement dont l'issue n'est pas confirmée passe à **`INCONNU`**. Il **ne se relance pas et ne s'annule pas**.
- Avant **toute nouvelle tentative**, `paiement` **rapproche** le règlement du relevé du fournisseur. Le rapprochement le tranche : `PAYE` ou `ECHEC` confirmé.
- Après une restauration de l'instance, les règlements de la période perdue sont rapprochés du relevé **avant** de reprendre tout règlement.
- Les confirmations de virement arrivent par le **relais Money Vibes** que l'instance tire (spine du moteur, AD-9). Si le relais est injoignable, le règlement s'affiche « en attente du relais ».

### 2.5 L'opposition avant un chèque de remplacement

- Un chèque **annulé** passe à `CHEQUE_EN_OPPOSITION`. Il exige l'**opposition bancaire enregistrée** (référence, date) ou la restitution physique du chèque.
- Sans opposition, l'émission d'un chèque de remplacement est refusée (`OPPOSITION_NON_ENREGISTREE`).

### 2.6 Le second contrôle d'un ordre (SEP-04)

- L'ordre préparé par un comptable est **validé par une autre personne** : un second comptable, distinct de celui qui prépare.
- Au-dessus d'un seuil paramétré (`reglement.second_controle_seuil`), le directeur général le valide aussi. Ce second contrôle n'est pas une décision de règlement.
- Celui qui a modifié les coordonnées d'un bénéficiaire n'émet pas l'ordre. Celui qui rapproche n'est pas celui qui a émis.
- Un changement de coordonnées bancaires dans les 5 jours qui précèdent un paiement est une **alerte** et **bloque** l'ordre jusqu'à vérification.

### 2.7 Rien n'est émis pendant le délai de dénonciation

- Au corporel (véhicule terrestre à moteur), **aucun règlement issu d'une transaction n'est émis avant la fin du délai de dénonciation de 15 jours** (art. 235).
- La **garde est dans `sinistres`**, pas dans `paiement`. `sinistres` ne libère l'ordre qu'après le délai (condition `DELAI_DENONCIATION_ECOULE`, PRD Assurance FR-135) et le marque **« libéré »**.
- **`paiement` refuse tout ordre qui n'est pas marqué « libéré ».** Il ne calcule pas le délai et ne connaît pas la date d'éligibilité.

### 2.8 Le rapprochement et le doublon

- Le **rapprochement** des chèques, des virements et des paiements mobiles se fait dans `paiement`, par le comptable. Les paiements non rapprochés forment une file ; un écart de 60 jours est une alerte.
- Le **doublon de règlement** a une définition unique : même bénéficiaire et même sinistre (date, police, immatriculation), **jamais le montant**, sur 30 jours. Il est détecté **avant** l'émission.
- Une période comptable ne se clôt pas tant qu'il reste un règlement non rapproché.

### 2.9 Les faits publiés

`paiement` ne publie aujourd'hui que des faits d'encaissement. Il publie en plus, **proposés par l'annexe A du PRD Assurance** :

- `paiement.reglement.execute@1`
- `paiement.reglement.echoue@1`
- `paiement.reglement.inconnu@1`
- `paiement.reglement.rapproche@1`

Ces faits portent la clé d'idempotence, l'identifiant du règlement de `sinistres`, l'état et le moyen. Ils ne portent **aucune donnée de santé**. `sinistres` et `expertises` (honoraires payés) les consomment. Les noms sont des propositions ; le manifeste de `paiement` sera amendé à l'écriture des stories.

## 3. Ce qui n'est pas dans cet amendement

- L'**adaptateur Mobile Money sortant** : à chiffrer au plan, puis amendement à part.
- Le **statut juridique** d'une initiation de paiement ou d'un règlement Mobile Money par une compagnie d'assurance : à faire confirmer par un juriste (PRD Assurance FR-24, J-25).
- Les contrôles de lutte contre le blanchiment (bénéficiaire vérifié, cumul par client) : ils vivent dans `sinistres` et ses alertes ; `paiement` n'en change pas les règles.
- Les règles d'encaissement et le rattachement des créances : inchangés.

## 4. Critères de recette

- Le même ordre de règlement envoyé deux fois ne fait partir l'argent qu'une fois.
- Un règlement dont l'issue est inconnue passe à `INCONNU` ; aucune nouvelle tentative ne part avant le rapprochement du relevé.
- Un chèque annulé sans opposition enregistrée : le chèque de remplacement est refusé (`OPPOSITION_NON_ENREGISTREE`).
- Un ordre validé par le même comptable que celui qui l'a préparé est refusé ; au-dessus du seuil, il faut aussi le directeur général.
- Un ordre non marqué « libéré » est refusé, quel que soit le moyen ; marqué « libéré », il part. Le mécanisme de la marque est fixé par la spine assurance.
- Un règlement en espèces au-dessus du plafond est refusé avec un code nommé.
- Un opérateur sans adaptateur sortant s'affiche « bientôt » ; le dossier propose un autre moyen ; rien n'est simulé.
- Un virement vers le même bénéficiaire pour le même sinistre, montant différent, dans les 30 jours, est détecté comme doublon avant l'émission.
- Chaque issue publie son fait `paiement.reglement.*@1`, sans donnée de santé.
