# Amendement du 2026-11-13 — la supervision lisible sur place

**Statut : ✅ VALIDÉ par le PO le 2026-11-13** (tri des hypothèses du PRD Microfinance). À appliquer à `prd.md` avec l'épic de supervision.

**Source :** `prds/prd-microfinance-2026-11-13/prd.md`, FR-265.

## Ce qui change

La supervision du moteur se lit surtout chez Money Vibes. Une IMF qui exploite elle-même ses serveurs a besoin de la lire **sur place, sans internet**. L'instance offre donc à son équipe informatique (rôle ADMIN_IMF) un **tableau de supervision local**, sans donnée métier :

- l'état de chaque service et de chaque module ;
- les sauvegardes (dernière réussie, dernier essai de restauration) ;
- l'échange avec le cœur (fraîcheur, file des écarts, en nombre seulement) ;
- les destinations sortantes déclarées et leur joignabilité (spine moteur, AD-9 amendé le 2026-11-13) ;
- l'état de la licence, du gel et de la version (normal, gel, version figée).

## Critères de recette

- Câble internet débranché, le tableau local reste lisible et à jour.
- Aucun chiffre métier (montant, nom de client) n'apparaît dans le tableau.
