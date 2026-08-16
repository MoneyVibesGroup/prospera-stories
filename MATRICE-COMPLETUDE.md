# Matrice de completude du programme

> **Genere par `outils/verifier.py --matrice`. Ne pas editer a la main.**
> Un module sans artefact n'est pas une erreur du script : c'est un trou reel.
> Les modules sont lus depuis `PROSPERA_SEQUENCE_MODULES_v2.md` — en ajouter un
> la-bas le fait apparaitre ici automatiquement.

## Chantiers hors sequence numerotee

| Chantier | PRD | Architecture | Decoupage |
| --- | :---: | :---: | :---: |
| Fiscalite (fiscal-service) | OUI | OUI | OUI |
| PI-SPI (paiement-service) | OUI | OUI | OUI |
| Balance / Atelier | OUI | OUI | — |
| Bilan & liasse | OUI | OUI | — |
| Dossier client | — | OUI | — |
| Socle & habilitations | — | OUI | — |
| Catalogue plateforme | — | OUI | — |
| KYC | — | OUI | — |
| GED / OCR (document-service) | — | — | — |

## Sequence des modules

| # | Module | Verticales | PRD | Architecture | Decoupage |
| :--: | --- | --- | :---: | :---: | :---: |
| 1 | Canaux & notifications — WhatsApp, SMS, e-mail, push | les 5 | OUI | OUI | OUI |
| 2 | Point de vente (PDV) | Dist | OUI | OUI | OUI |
| 3 | Catalogue produits | Dist | OUI | OUI | OUI |
| 4 | Réseau, agences & zones | IMF · Assur · Dist | OUI | OUI | OUI |
| 5 | Immobilisations & amortissements | ExpCo · Dist · IMF · Assur | — | — | — |
| 6 | Assistant IA — socle (LlmProvider, contrat Proposition, RAG CGI/LPF) | les 5 | OUI | — | — |
| 7 | Stock | Dist | OUI | OUI | OUI |
| 8 | Support / Service client | Dist · IMF · Assur · MV App | — | — | — |
| 9 | Commercial / Agent terrain — mobile, offline, GPS | Dist · IMF · Assur | — | — | — |
| 10 | Marketing & campagnes | Dist · IMF · Assur | — | — | — |
| 11 | Commande | Dist | — | — | — |
| 12 | Opérations entrepôt | Dist | — | — | — |
| 13 | Approvisionnement & fournisseurs | Dist | — | — | — |
| 14 | Studio réseaux sociaux & inbox centralisée | Dist · IMF · Assur · MV App | — | — | — |
| 15 | Caisse, guichet & trésorerie | IMF | — | — | — |
| 16 | Conquête, territoires & objectifs | Dist | — | — | — |
| 17 | Facturation, proforma & e-facture | Dist | — | — | — |
| 18 | Équipe & performance | Dist · IMF · Assur | — | — | — |
| 19 | Crédit — cycle, comité & BIC | IMF | — | — | — |
| 20 | Collecte | IMF | — | — | — |
| 21 | Finance (Transactions) | Dist · IMF · Assur | — | — | — |
| 22 | Épargne & dépôts | IMF | — | — | — |
| 23 | Risque, PAR & provisionnement | IMF | — | — | — |
| 24 | Relance & Recouvrement | Dist · IMF · Assur · MV App | — | — | — |
| 25 | Contrôle de Gestion | Dist · IMF · Assur · ExpCo | — | — | — |
| 26 | Verticaux formels & abonnements (plans, provisioning, self-service) | les 5 | — | — | — |
| 27 | Conformité BCEAO & Audit LCB/FT | Dist · IMF · Assur | — | — | — |
| 28 | Automatisations & Copilot IA — surfaces | les 5 | — | — | — |
| 29 | Dashboard & génération de rapports | Dist · IMF · Assur | — | — | — |

## Lecture

- **PRD OUI, Architecture —** : le besoin est cadre, rien ne dit comment le construire.
- **Architecture OUI, Decoupage —** : les decisions existent, aucune story ne s'y adosse.
- **Tout a —** : zone blanche. Normale au-dela de la vague en cours, anormale en deca.
