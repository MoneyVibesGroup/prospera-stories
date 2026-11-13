# Amendement du 2026-11-13 — les échéances de prêt de la microfinance

**Statut : ✅ VALIDÉ par le PO le 2026-11-13** (décisions Q2, P1 et B1 du PRD Microfinance). À appliquer à `prd.md` quand les stories de `paiement` pour la microfinance seront écrites.

**Date :** 2026-11-13 · **Demandé par :** le PRD Microfinance (`prds/prd-microfinance-2026-11-13/prd.md`, FR-209, FR-210, FR-256, FR-257) · **Rédigé pour :** Dev A et Dev B, qui écriront les stories.

---

## 1. Pourquoi un amendement

Le PRD `paiement` et le PRD distributeur (PRD-D FR-247) font de `paiement` le **propriétaire unique** de la Créance. La source `ECHEANCE_DE_PRET` y est seulement « réservée aux verticales microfinance et assurance ». Le PRD Microfinance l'ouvre. Le PO a décidé trois choses :

- **Q2** : `paiement` **reste le seul propriétaire des créances**, échéances de prêt comprises. Le PRD distributeur n'est pas amendé. L'articulation avec le compte de prêt du cœur de l'IMF sera analysée quand le connecteur réel sera ajouté.
- **P1** : le **montant exigible** d'une échéance se recale sur la dernière lecture du cœur de l'IMF, pour éviter qu'un client paie deux fois.
- **B1** : `paiement` reçoit un **réglage « écart de rattachement par type de créance »**, sans amender le PRD distributeur.

## 2. Ce qui change dans `paiement`

### 2.1 La source `ECHEANCE_DE_PRET` est ouverte

- Une Créance de source `ECHEANCE_DE_PRET` s'ouvre sur l'**échéancier contractuel** du comité de crédit, quand le dossier passe à EN_GESTION ; elle devient **exigible** à la confirmation du décaissement par le cœur (PRD Microfinance FR-70, FR-257).
- Ses composantes sont : principal, intérêt, pénalité, frais. Les pénalités et intérêts de retard viennent des faits du cœur, avec leur source et leur date.
- L'ordre d'imputation est paramétrable ; le défaut est pénalités, puis intérêts, puis capital.

### 2.2 Le montant exigible se recale sur le cœur (P1)

- Un **lien de paiement** n'est émis qu'après une relecture du reste dû auprès du cœur, plus récente qu'un âge maximal (paramètre ; défaut : 15 minutes).
- Un mouvement du cœur sans paiement Prospera correspondant **réduit ou ferme** la Créance avant le prochain envoi de relance.
- En cas d'écart de montant, le client voit le montant du cœur ; l'écart entre dans la file des écarts, visible du gestionnaire de portefeuille et du comptable.

### 2.3 L'écart de rattachement par type de créance (B1)

- Nouveau réglage : **écart de rattachement**, par type de créance (source). Défauts : facture du distributeur, règle actuelle de FR-P38 inchangée ; **échéance de prêt : 1 %**.
- Le rattachement **choisit** l'échéance ; il ne la **solde** pas. Tout écart non nul est un paiement partiel ou un trop-perçu (crédit du client).
- La **tolérance d'arrondi** est un réglage distinct (défaut : 5 FCFA) : un reste dû inférieur ou égal est traité comme nul.
- La cascade de clés de rapprochement de FR-P38 ne change pas.

### 2.4 Ce qui n'est pas dans cet amendement

- Le **décaissement Mobile Money sortant** par opérateur : `paiement` n'a aujourd'hui que l'ordre sortant PI-SPI. Dans la démo de février, le cœur fictif décaisse par Mobile Money (décision Q1) ; l'adaptateur sortant de `paiement` est **à chiffrer au plan**, puis à écrire dans un amendement à part.
- La **validation par le comptable** des paiements Mobile Money déclarés : elle existe déjà (FR-P31 à FR-P36) ; le PRD Microfinance s'en sert sans la changer.

## 3. Critères de recette

- Une échéance de 50 000 FCFA reçoit 49 600 FCFA (écart de 0,8 %) : le paiement est rattaché à cette échéance ; le reste dû est 400 FCFA ; la relance continue sur 400 FCFA.
- Une échéance de 50 000 FCFA reçoit 50 003 FCFA : le reste dû est nul (tolérance d'arrondi) ; le trop-perçu de 3 FCFA devient un crédit du client.
- Une facture du distributeur garde sa règle de rattachement actuelle : un test du PRD distributeur reste vert.
- Un paiement au guichet du cœur, sans paiement Prospera, ferme la Créance avant la relance suivante ; aucun lien de paiement ne part sur l'ancien montant.
