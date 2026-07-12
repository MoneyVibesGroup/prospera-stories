# Référentiels — amorces (2026-07-12)

Amorces de référentiels pour le module **Atelier Balance** / `bilan-service`, extraites des documents fournis par l'utilisateur le 2026-07-12. **Statut : brouillons à documenter et valider par un expert** (voir `rapport-bilan-logique-metier-2026-07-12.md`).

## Fichiers

| Fichier | Contenu | Source | Statut |
|---|---|---|---|
| `postes-syscohada-guidef-togo.csv` / `.json` | **163 postes** d'états financiers (codes officiels + libellés + renvoi note) : Bilan Actif (30), Bilan Passif (29), Compte de Résultat (43), TFT (26), Résultat fiscal (23), Liquidation IS (12) | Extrait de la liasse GUIDEF `1000745307_2025_Definitif (1).xlsx` (DSF Togo, Système Normal) | Amorce — base de la **table de passage** comptes→postes |
| `paquet-fiscal-togo-2026.json` | Taux & règles fiscales Togo 2026 : IS 27 %, MFP 1 % CA (impôt = max(MFP, IS)), TVA 18 %, 4 acomptes, régimes (réel/synthétique-TPU), mécanisme réintégrations/déductions | Extrait de `CGI et LPF 2026_ (1).pdf` | Amorce — en-têtes confirmés, détails à compléter |
| `table-de-passage-syscohada.json` / `.csv` | **Table de passage compte SYSCOHADA → poste GUIDEF** (79 postes détail + 20 totaux) : Bilan Actif/Passif + Compte de Résultat, avec règles (NET_ACTIF, SOLDE_CREDITEUR, CHARGE/PRODUIT) | Construite (règles standard SYSCOHADA révisé) contre les codes postes extraits | Amorce — **validée à 100 %** (voir ci-dessous) |

## ✅ Validation de la table de passage (2026-07-12)

Croisée avec les **50 comptes réels** de la balance Sage `Balance_des_comptes.pdf` (ETS RELAXED) : **0 compte non mappé**. Points confirmés : mobile money **TMONEY → Trésorerie**, comptes **alphanumériques** (`5211BOA0`) gérés par préfixe, **amortissements (28x)** traités en contra (déduits du net actif), ambiguïté **classes 4/5** (actif si débiteur / passif si créditeur) résolue au **solde**. Restes à affiner (non bloquants) : distinguer sous-total `AQ` du détail `AS` ; ventilation fine de certains sous-comptes 44x ; **TFT et section fiscale** (résultat fiscal, liquidation) à mapper dans un second temps.

## Provenance & confiance

- **Postes** : extraction fidèle des codes/libellés du classeur officiel → fiable pour la structure ; reste à établir le **mapping comptes→postes** (quel compte SYSCOHADA alimente quel code poste).
- **Taux fiscaux** : lus directement dans le CGI 2026 (références d'articles dans le JSON). Les **détails** (tranches TPU, seuils exacts) et le **barème CNSS** restent à compléter, puis **validation experte** obligatoire.

## Prochaines étapes

1. Compléter la **table de passage** (numéro de compte SYSCOHADA → code poste) — pièce maîtresse de FR-006.
2. Compléter le paquet fiscal (cf. `aFaire` dans le JSON) + barème CNSS.
3. Généraliser le schéma à d'autres pays UEMOA (le paquet est keyé `pays × année` ; le gabarit GUIDEF est géré côté admin — D12).
4. Prévoir la liasse **SMT** (régime synthétique) — plus simple, à obtenir.
