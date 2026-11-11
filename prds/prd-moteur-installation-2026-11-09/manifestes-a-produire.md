---
title: Manifestes à produire — liste des modules commerciaux de toutes les verticales
created: 2026-11-10
source: prospera_pricing.md, PROSPERA_MODULES_ET_ROADMAP.md, prospera_pricing_distribution.md, prospera_modules_bundles_distributeur.md, Offre-commerciale-Prospera-Assurance-v4-7mois.md, modules.seed-data.ts, packs.seed-data.ts, PLAN-2-DEVS-8-SEMAINES-2026-10-26.md (§4, §5), dossiers *-service
---

# Manifestes à produire

Un module sans manifeste au catalogue ne se vend pas (exigences FR-12 et FR-38 du PRD moteur) : ce tableau liste les 44 modules commerciaux à doter d'un manifeste, chacun écrit avec la première story du module (contrat de module C1).

Légende : ✅ = code présent à `modules.seed-data.ts` ; ❌ = code à créer. Les n° sont ceux de la séquence v2 du plan (§4), qui diffèrent de la numérotation 1-29 de `PROSPERA_MODULES_ET_ROADMAP.md`. « Après le chiffrage du 04/12 » = aucune story datée au plan (cadrage de Dev B en semaines 2 à 4, code non planifié avant le 15/01).

| # | Module commercial | Verticales | Bundles | Code catalogue | Service porteur | N° v2 | Propriétaire | Date du manifeste | Cadré (PRD) | Remarques |
|--:|---|---|---|---|---|:-:|---|---|---|---|
| M01 | Réseau, agences & zones | distributeur, microfinance, assurance | M: Croissance & Opérations (Équipes & Réseau d'Agences) ; D: Plateforme [À CONFIRMER] | ❌ reseau | reseau-service (à créer) | — (EPIC-044→053) | Dev A | 09/11/2026 | oui (prd-reseau-zones) | Commun aux 3 projets ; semaine 1 du plan |
| M02 | CRM Points de Vente & Pipeline | distributeur | D: Terrain & Ventes, Plateforme | ✅ pdv | pdv-service (à créer) | — (EPIC-085→094) | Dev A | 30/11/2026 | oui (prd-pdv) | Bloc 1 en semaine 4 |
| M03 | Support client & CRM interne | distributeur, microfinance, assurance, cabinet [À CONFIRMER] | Aucun bundle commercial [À CONFIRMER] | ✅ support-client (déprécié, à réactiver) | support-crm-service (à créer) | n°8 | Dev B | 14/12/2026 | non |  |
| M04 | Catalogue, produits & tarification (Prise de commande & Catalogue ; Produits Financiers) | distributeur, microfinance | D: Terrain & Ventes, Plateforme ; M: Croissance & Opérations (Produits Financiers) [À CONFIRMER] | ✅ catalogue | catalogue-produits-service (à créer) | — (EPIC-065→070) | Dev A | 14/12/2026 | oui (prd-catalogue-produits) | Fusion D/M à confirmer |
| M05 | Gestion des sinistres | assurance | A: offre unique (phases 1-2) | ❌ sinistres | prospera-assurance-service (dossiers sinistres) (existant) | — (cycle DECLARE→CLOTURE) | Dev B | 04/01/2027 | non (epics-assurance seulement) | Noyau en semaine 7 |
| M06 | Stock & logistique | distributeur | D: Stock & Logistique, Plateforme | ✅ stock | stock-service (à créer) | — (EPIC-075→078) | Dev A | 04/01/2027 | oui (prd-stock) | Blocs 1-2 en semaine 7 |
| M07 | GED, numérisation & OCR (KYC & GED) | microfinance, assurance [À CONFIRMER] | A: offre unique (phase 1 GED/OCR) ; M: CRM Emprunteurs (pièces KYC) [À CONFIRMER] | ❌ ged | document-service (extension : lots, indexation, archivage) (existant) | — | Dev B | 11/01/2027 | non (tech-spec-document-service) | Cabinet à confirmer |
| M08 | Commande (prise de commande) | distributeur | D: Terrain & Ventes, Plateforme | ✅ commande | commande-service [À CONFIRMER] (à créer) | n°11 | Dev B | après le chiffrage du 04/12 | non |  |
| M09 | Facturation, proforma & e-facture | distributeur | D: Finance & Recouvrement, Plateforme | ✅ facturation | paiement-service (arrêté→créance, STORY-647/649) + facturation [À CONFIRMER] (partiel) | n°17 | Dev B | après le chiffrage du 04/12 | non (prd-paiement-service pour le rail) |  |
| M10 | Approvisionnement & fournisseurs | distributeur | D: Stock & Logistique, Plateforme | ❌ approvisionnement | à créer (à créer) | n°13 | Dev B | après le chiffrage du 04/12 | non |  |
| M11 | Opérations entrepôt | distributeur | D: Stock & Logistique, Plateforme | ❌ entrepot | à créer (peut s'adosser à stock-service) [À CONFIRMER] (à créer) | n°12 | Dev B | après le chiffrage du 04/12 | non |  |
| M12 | Commercial terrain & application mobile (Terrain & Tournées ; Agents terrain) | distributeur, microfinance | D: Terrain & Ventes, Plateforme ; M: Terrain & Collecte | ❌ terrain | à créer + app mobile prospera-terrain (à créer) | n°9 | Dev B | après le chiffrage du 04/12 | non | Une seule fiche pour D et M [À CONFIRMER] |
| M13 | Conquête, territoires, objectifs & quotas | distributeur | D: Croissance & Équipes, Plateforme | ❌ conquete-objectifs | à créer (à créer) | n°16 | Dev B | après le chiffrage du 04/12 | non | Deux lignes d'origine (3 et 17) fusionnées par le plan [À CONFIRMER] |
| M14 | Caisse, guichet & trésorerie réseau (Caisse & Mobile Money) | microfinance | M: Terrain & Collecte, Plateforme | ❌ caisse | prospera-microfinance-service (à étendre) [À CONFIRMER] (partiel) | n°15 | Dev B | après le chiffrage du 04/12 | non (epics-microfinance) |  |
| M15 | Crédit : cycle, comité & BIC | microfinance | M: Crédit, Plateforme | ✅ credit | prospera-microfinance-service (crédits) (existant) | n°19 | Dev B | après le chiffrage du 04/12 | non (epics-microfinance) |  |
| M16 | Collecte terrain | microfinance | M: Terrain & Collecte [À CONFIRMER] | ✅ collecte | prospera-microfinance-service [À CONFIRMER] (partiel) | n°20 | Dev B | après le chiffrage du 04/12 | non (epics-microfinance) | Absent des 13 modules du pricing ; présent au pack imf-sfd |
| M17 | Épargne & dépôts | microfinance | M: Croissance & Opérations, Plateforme | ❌ epargne [À CONFIRMER] | prospera-microfinance-service (dépôts) (existant) | n°22 | Dev B | après le chiffrage du 04/12 | non (epics-microfinance) | Code à créer ou couvert par `microfinance` [À CONFIRMER] |
| M18 | Risque, PAR & provisionnement | microfinance | M: Risque & Conformité [À CONFIRMER], Plateforme | ❌ risque-par | prospera-microfinance-service (prudentiel) (partiel) | n°23 | Dev B | après le chiffrage du 04/12 | non (epics-microfinance) |  |
| M19 | Relances & Recouvrement | distributeur, microfinance | D: Finance & Recouvrement, Plateforme ; M: Terrain & Collecte (Relances), Risque & Conformité (Recouvrement) | ✅ recouvrement | à créer (s'appuie sur notification-service + paiement-service) [À CONFIRMER] (à créer) | n°24 | Dev B | après le chiffrage du 04/12 | non | Relances et Recouvrement IMF : une ou deux fiches ? [À CONFIRMER] |
| M20 | Conformité BCEAO, audit & LCB/FT | microfinance | M: Risque & Conformité, Plateforme | ✅ conformite-bceao | prospera-microfinance-service (prudentiel) (partiel) | n°27 | Dev B | après le chiffrage du 04/12 | non (epics-microfinance) |  |
| M21 | Équipes & performance | distributeur, microfinance | D: Croissance & Équipes ; M: Croissance & Opérations (Équipes & Réseau) | ✅ equipe (déprécié, à réactiver) | à créer (à créer) | n°18 | Dev B | après le chiffrage du 04/12 | non |  |
| M22 | Comptabilité & Finance (transactions) | distributeur, microfinance, assurance | D: Finance & Recouvrement ; M: Risque & Conformité (Finance & Comptabilité) ; A: offre unique (chaîne de règlement) | ✅ finance-transactions | à créer [À CONFIRMER] (cf. epics-comptabilite) (à créer) | n°21 | Dev B | après le chiffrage du 04/12 | non (epics-comptabilite) | Le produit ne passe pas d'écritures de grand livre à ce jour |
| M23 | Marketing & campagnes | distributeur, microfinance | D: Croissance & Équipes ; M: Croissance & Opérations (Marketing & Acquisition) | ❌ marketing | à créer (à créer) | n°10 | Dev B | après le chiffrage du 04/12 | non |  |
| M24 | Studio réseaux sociaux | distributeur | D: Croissance & Équipes, Plateforme | ❌ studio-social | à créer [À CONFIRMER] (à créer) | — (peut-être n°10) | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non | Peut fusionner avec Marketing [À CONFIRMER] |
| M25 | Contrôle de gestion | distributeur, microfinance [À CONFIRMER] | D: Plateforme (hors bundle) ; M: fondu dans le DAF | ❌ controle-gestion | à créer (à créer) | n°25 | Dev B | après le chiffrage du 04/12 | non |  |
| M26 | Automatisations & Copilot IA | distributeur, microfinance | D: Croissance & Équipes ; M: Plateforme (IA native) | ❌ automatisations | assistant-service [À CONFIRMER] (à créer) | n°28 | Dev B | après le chiffrage du 04/12 | non (voir Assistant IA) |  |
| M27 | Assistant IA & analyse de dossier (résumé, recherche sémantique, détection d'anomalies) | assurance | A: offre unique (phases 2-3) | ❌ assistant-ia | assistant-service (à créer) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-assistant-ia) | Absent du plan ; PRD existant |
| M28 | Dashboard & pilotage | distributeur, microfinance, assurance, cabinet [À CONFIRMER] | D: Stock & Logistique, Plateforme ; M: Crédit ; A: offre unique (tableau de bord direction) | ✅ dashboard (déprécié, à réactiver) | à créer (à créer) | n°29 | Dev B | après le chiffrage du 04/12 | non |  |
| M29 | Expertises & intervenants (experts, médecins, portail expert) | assurance | A: offre unique | ❌ expertises | prospera-assurance-service (à étendre) (partiel) | — | Dev B | après le chiffrage du 04/12 | non |  |
| M30 | Production & polices | assurance | A: offre unique (reprise clients/polices) | ❌ polices [À CONFIRMER] | prospera-assurance-service (contrats) (existant) | — | Dev B | après le chiffrage du 04/12 | non (epics-assurance) | Code à créer ou couvert par `assurance` [À CONFIRMER] |
| M31 | Comptes techniques, provisions & réassurance CIMA | assurance | A: pack assurance-cima | ✅ assurance | prospera-assurance-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non (epics-assurance) | Rétro-saisie du manifeste ; palier 2 (EPIC-131) hors cadrage |
| M32 | CRM Emprunteurs, KYC & membres | microfinance | M: Crédit, Plateforme | ✅ microfinance [À CONFIRMER] | prospera-microfinance-service (membres) + kyc-service [À CONFIRMER] (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non (epics-microfinance) | Correspondance code/nom déduite |
| M33 | Encaissements & PI-SPI (liens de paiement, Mobile Money) | distributeur, microfinance | D: Finance & Recouvrement, Plateforme ; M: Terrain & Collecte (Caisse & Mobile Money) [À CONFIRMER] | ✅ pi-spi [À CONFIRMER] | prospera-paiement-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-paiement-service) | Le seed décrit `pi-spi` comme prudentiel : description à corriger [À CONFIRMER] |
| M34 | Canaux & notifications (WhatsApp, SMS, e-mail) | distributeur, microfinance, assurance, cabinet | Transverse, non vendu seul [À CONFIRMER] | ❌ notification | prospera-notification-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-notification-service) | À détenir par Money Vibes à l'amorçage |
| M35 | Atelier de balance | distributeur, microfinance, assurance, cabinet | Pack de chaque vertical | ✅ balance | balance-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-atelier-balance) | Rétro-saisie du manifeste |
| M36 | Bilan comptable & prévisionnel | distributeur, microfinance, assurance, cabinet | Pack de chaque vertical | ✅ bilan | bilan-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-bilan-service) | Rétro-saisie du manifeste |
| M37 | Déclarations fiscales | cabinet | Pack cabinet | ✅ declarations | prospera-fiscal-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-fiscalite) | Rétro-saisie du manifeste |
| M38 | Conseil fiscal | cabinet | Pack cabinet | ✅ conseil | prospera-fiscal-service (existant) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-fiscalite) | Rétro-saisie du manifeste |
| M39 | Portail client cabinet & missions | cabinet | Option cabinet, phase 2 | ❌ portail-cabinet | à créer (à créer) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non |  |
| M40 | Immobilisations & amortissements | distributeur, cabinet [À CONFIRMER] | Option rattachée au bilan [À CONFIRMER] | ❌ immobilisations | à créer (à créer) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non | Rattachement au bilan ou module dédié à trancher |
| M41 | Paie & déclarations sociales | microfinance, cabinet [À CONFIRMER] | Option non datée | ❌ paie | à créer (à créer) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non | Périmètre à trancher (décision ouverte) |
| M42 | Add-on Réseau Freelance | distributeur | Add-on (Grand et Moyen ; option des 4 bundles) | ❌ freelance | à créer (transverse aux modules D) (à créer) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | non | Add-on, non un module : manifeste ou option de pack [À CONFIRMER] |
| M43 | Connecteurs & intégrations (Odoo, banques, Mobile Money, OTR, signature) | distributeur, microfinance, assurance, cabinet | Un seul module commercial, ajouté d'office dès que le contrat déclare un logiciel du client ; inclus dans la plateforme complète (décision du PO, 2026-11-11) | ❌ connecteurs | à créer (à créer) | — | Dev B [À CONFIRMER] | après le chiffrage du 04/12 | oui (prd-connecteurs) | Chantier continu ; requis en février (QA-3) |
| M44 | Reprise de données | distributeur, microfinance, assurance | Module installable, ouvert d'office dans l'essai du prospect (décision du PO, 2026-11-11) ; offre [À CONFIRMER] | ❌ reprise | à trancher par la spine (patron D13 de balance-service) | — | Dev B [À CONFIRMER] | avant février 2027 | oui (prd-reprise-donnees) | Requis en février (QA-3) ; module d'écran `reprise` dans `prospera-app` |

## Récapitulatif

Total : **44 modules** (M44 Reprise de données ajouté le 2026-11-11).

Par vertical (un module partagé compte dans chacune de ses verticales) :

- distributeur : 27
- microfinance : 26
- assurance : 15
- cabinet : 11

Code catalogue existant ✅ : **20** sur 44 (dont 3 dépréciés à réactiver : support-client, equipe, dashboard) ; à créer : 24.

Par propriétaire : Dev A = 4 ; Dev B = 40 (dont 16 attribués par déduction [À CONFIRMER]).

Manifestes datés au plan, avant le 15/01/2027 : **7** (Réseau, CRM Points de Vente & Pipeline, Support client & CRM interne, Catalogue, Gestion des sinistres, Stock & logistique, GED). Les 37 autres n'ont pas de première story datée au plan : ils tombent « après le chiffrage du 04/12 » et, faute de code planifié, après le 15/01.

## Points [À CONFIRMER]

Modules portant au moins un marqueur : **35**. Détail :

- M01 Réseau, agences & zones : bundles
- M03 Support client & CRM interne : verticales, bundles
- M04 Catalogue, produits & tarification : bundles
- M07 GED, numérisation & OCR : verticales, bundles
- M08 Commande : service
- M09 Facturation, proforma & e-facture : service
- M11 Opérations entrepôt : service
- M12 Commercial terrain & application mobile : remarque
- M13 Conquête, territoires, objectifs & quotas : remarque
- M14 Caisse, guichet & trésorerie réseau : service
- M16 Collecte terrain : bundles, service
- M17 Épargne & dépôts : code, remarque
- M18 Risque, PAR & provisionnement : bundles
- M19 Relances & Recouvrement : service, remarque
- M22 Comptabilité & Finance : service
- M24 Studio réseaux sociaux : service, propriétaire, remarque
- M25 Contrôle de gestion : verticales
- M26 Automatisations & Copilot IA : service
- M27 Assistant IA & analyse de dossier : propriétaire
- M28 Dashboard & pilotage : verticales
- M30 Production & polices : code, remarque
- M31 Comptes techniques, provisions & réassurance CIMA : propriétaire
- M32 CRM Emprunteurs, KYC & membres : code, service, propriétaire
- M33 Encaissements & PI-SPI : bundles, code, propriétaire, remarque
- M34 Canaux & notifications : bundles, propriétaire
- M35 Atelier de balance : propriétaire
- M36 Bilan comptable & prévisionnel : propriétaire
- M37 Déclarations fiscales : propriétaire
- M38 Conseil fiscal : propriétaire
- M39 Portail client cabinet & missions : propriétaire
- M40 Immobilisations & amortissements : verticales, bundles, propriétaire
- M41 Paie & déclarations sociales : verticales, propriétaire
- M42 Add-on Réseau Freelance : propriétaire, remarque
- M43 Connecteurs & intégrations : propriétaire
- M44 Reprise de données : bundles, propriétaire

## Hors liste

- `fiscalite` (déprécié au catalogue, remplacé par `declarations` et `conseil`) et le socle (auth, catalogue, moteur d'installation, coque `prospera-app`) ne sont pas des modules commerciaux.
- L'offre assurance v4 ne détaille pas de modules : les lignes A sont déduites de ses phases 1-3 et du lot 4 du plan.
