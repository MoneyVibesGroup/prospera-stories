---
title: Manifestes à produire — liste des modules commerciaux de toutes les verticales
created: 2026-11-10
source: prospera_pricing.md, PROSPERA_MODULES_ET_ROADMAP.md, prospera_pricing_distribution.md, prospera_modules_bundles_distributeur.md, Offre-commerciale-Prospera-Assurance-v4-7mois.md, modules.seed-data.ts, packs.seed-data.ts, PLAN-2-DEVS-8-SEMAINES-2026-10-26.md (§4, §5), dossiers *-service
---

# Manifestes à produire

Un module sans manifeste au catalogue ne se vend pas (exigences FR-12 et FR-38 du PRD moteur) : ce tableau liste les 44 modules commerciaux à doter d'un manifeste. **Décision du PO du 2026-11-11 (réponse 7 au §9 de l'amendement du plan v3) : Dev B les écrit tous, le plus tôt possible** : ceux des modules déjà codés et de la démo avant le 20/11, les autres avec le PRD de leur lot. Ils sont écrits dans `prospera-stories`, au format de C1, chargés au catalogue par EPIC-143 ; le fichier `module.manifest.ts` de chaque dépôt est copié par le propriétaire du dépôt la semaine où il y travaille (carte des dépôts, `epics-moteur-installation-2026-11-11.md`).

Légende : ✅ = code présent à `modules.seed-data.ts` ; ❌ = code à créer. Les n° sont ceux de la séquence v2 du plan (§4), qui diffèrent de la numérotation 1-29 de `PROSPERA_MODULES_ET_ROADMAP.md`. « Après le chiffrage du 04/12 » = aucune story datée au plan (cadrage de Dev B en semaines 2 à 4, code non planifié avant le 15/01).

| # | Module commercial | Verticales | Bundles | Code catalogue | Service porteur | N° v2 | Propriétaire | Date du manifeste | Cadré (PRD) | Remarques |
|--:|---|---|---|---|---|:-:|---|---|---|---|
| M01 | Réseau, agences & zones | distributeur, microfinance, assurance | M: Croissance & Opérations (Équipes & Réseau d'Agences) ; D: Plateforme [À CONFIRMER] | ❌ reseau | reseau-service (à créer) | — (EPIC-044→053) | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/reseau.manifest.ts` (objet `commercial` validé par le PO ; invitation par SMS à ajouter dans auth-service) | oui (prd-reseau-zones) | Commun aux 3 projets ; semaine 1 du plan |
| M02 | CRM Points de Vente & Pipeline | distributeur | D: Terrain & Ventes, Plateforme | ✅ pdv | pdv-service (à créer) | — (EPIC-085→094) | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/pdv.manifest.ts` | oui (prd-pdv) | Bloc 1 en semaine 4 |
| M03 | Support client & CRM interne | distributeur, microfinance, assurance, cabinet [À CONFIRMER] | Aucun bundle commercial [À CONFIRMER] | ✅ support-client (déprécié, à réactiver) | support-crm-service (à créer) | n°8 | Dev B | 04/12/2026 (lot 4) | non |  |
| M04 | Catalogue, produits & tarification (Prise de commande & Catalogue ; Produits Financiers) | distributeur, microfinance | D: Terrain & Ventes, Plateforme ; M: Croissance & Opérations (Produits Financiers) [À CONFIRMER] | ✅ catalogue | catalogue-produits-service (à créer) | — (EPIC-065→070) | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/catalogue.manifest.ts` (code `catalogue` gardé par le PO, renommage AD-14 abandonné ; « Produits financiers » → `credit` et `microfinance`, décision du PO) | oui (prd-catalogue-produits) | Fusion D/M à confirmer |
| M05 | Gestion des sinistres | assurance | A: offre unique (phases 1-2) | ❌ sinistres | à cadrer par le PRD assurance (le registre des sinistres de prospera-assurance-service est la comptabilité CIMA, module `assurance`) | — | Dev B | avec le PRD assurance (décision du PO, 2026-11-12) | non (front de démo `prospera-assurance` + `docs/SPEC_METIER.md`) | Noyau en semaine 7. ⛔ Le module voulu est la GESTION des sinistres du front de démo (guichet, dossiers, expertises, indemnisation, recours, règlements, GED, pilotage), pas le registre CIMA : la rétro-saisie depuis le code (#418) a été fermée |
| M06 | Stock & logistique | distributeur | D: Stock & Logistique, Plateforme | ✅ stock | stock-service (à créer) | — (EPIC-075→078) | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/stock.manifest.ts` | oui (prd-stock) | Blocs 1-2 en semaine 7 |
| M07 | GED, numérisation & OCR (KYC & GED) | microfinance, assurance [À CONFIRMER] | A: offre unique (phase 1 GED/OCR) ; M: CRM Emprunteurs (pièces KYC) [À CONFIRMER] | ❌ ged | document-service (extension : lots, indexation, archivage) (existant) | — | Dev B | 04/12/2026 (lot 4) | non (tech-spec-document-service) | Cabinet à confirmer |
| M08 | Commande (prise de commande) | distributeur | D: Terrain & Ventes, Plateforme | ✅ commande | commande-service [À CONFIRMER] (à créer) | n°11 | Dev B | 20/11/2026 : **écrit le 2026-11-13**, `manifestes/commande.manifest.ts` (depends catalogue, pdv) | oui (prd-distributeur, §5 et annexe A) |  |
| M09 | Facturation, proforma & e-facture | distributeur | D: Finance & Recouvrement, Plateforme | ✅ facturation | paiement-service (arrêté→créance, STORY-647/649) + facturation [À CONFIRMER] (partiel) | n°17 | Dev B | 20/11/2026 : **écrit le 2026-11-13**, `manifestes/facturation.manifest.ts` (depends catalogue, pdv, paiement ; objets de reprise `facture-ouverte` et `suite-numerotation`) | oui (prd-distributeur, §5 et annexe A ; prd-paiement-service pour la Créance) |  |
| M10 | Approvisionnement & fournisseurs | distributeur | D: Stock & Logistique, Plateforme | ❌ approvisionnement | à créer (à créer) | n°13 | Dev B | 20/11/2026 : **écrit le 2026-11-13**, `manifestes/approvisionnement.manifest.ts` (depends stock, catalogue ; objet de reprise `fournisseur`) | oui (prd-distributeur, §5 et annexe A) |  |
| M11 | Opérations entrepôt | distributeur | D: Stock & Logistique, Plateforme | ❌ entrepot | à créer (peut s'adosser à stock-service) [À CONFIRMER] (à créer) | n°12 | Dev B | 20/11/2026 : **écrit le 2026-11-13**, `manifestes/entrepot.manifest.ts` (depends stock, commande) | oui (prd-distributeur, §5 et annexe A) |  |
| M12 | Commercial terrain & application mobile (Terrain & Tournées ; Agents terrain) | distributeur, microfinance | D: Terrain & Ventes, Plateforme ; M: Terrain & Collecte | ❌ terrain | à créer + app mobile prospera-terrain (à créer) | n°9 | Dev B | 20/11/2026 (lot 2) | non | Une seule fiche pour D et M [À CONFIRMER] |
| M13 | Conquête, territoires, objectifs & quotas | distributeur | D: Croissance & Équipes, Plateforme | ❌ conquete-objectifs | à créer (à créer) | n°16 | Dev B | 20/11/2026 : **écrit le 2026-11-13**, `manifestes/conquete-objectifs.manifest.ts` (depends reseau, pdv ; droits à la forme élargie, installable après la story auth-service) | oui (prd-distributeur, §5 et annexe A) | Deux lignes d'origine (3 et 17) fusionnées par le plan [À CONFIRMER] |
| M14 | Caisse, guichet & trésorerie réseau (Caisse & Mobile Money) | microfinance | M: Terrain & Collecte, Plateforme | ❌ caisse | prospera-microfinance-service (à étendre) [À CONFIRMER] (partiel) | n°15 | Dev B | 27/11/2026 (lot 3) | non (epics-microfinance) |  |
| M15 | Crédit : cycle, comité & BIC | microfinance | M: Crédit, Plateforme | ✅ credit | prospera-microfinance-service (crédits) (existant) | n°19 | Dev B | avec le PRD microfinance (décision du PO, 2026-11-12 : le service actuel est surtout le paquet SFD) | non (epics-microfinance) |  |
| M16 | Collecte terrain | microfinance | M: Terrain & Collecte [À CONFIRMER] | ✅ collecte | prospera-microfinance-service [À CONFIRMER] (partiel) | n°20 | Dev B | avec le PRD microfinance (décision du PO, 2026-11-12 : le service actuel est surtout le paquet SFD) | non (epics-microfinance) | Absent des 13 modules du pricing ; présent au pack imf-sfd |
| M17 | Épargne & dépôts | microfinance | M: Croissance & Opérations, Plateforme | ✅ microfinance (décision du PO, 2026-11-12) | prospera-microfinance-service (dépôts) (existant) | n°22 | Dev B | avec le PRD microfinance (décision du PO, 2026-11-12 : le service actuel est surtout le paquet SFD) | non (epics-microfinance) | Couvert par `microfinance` (décision du PO, 2026-11-12) : pas de code `epargne`, un seul manifeste avec M32 |
| M18 | Risque, PAR & provisionnement | microfinance | M: Risque & Conformité [À CONFIRMER], Plateforme | ❌ risque-par | prospera-microfinance-service (prudentiel) (partiel) | n°23 | Dev B | 27/11/2026 (lot 3) | non (epics-microfinance) |  |
| M19 | Relances & Recouvrement | distributeur, microfinance | D: Finance & Recouvrement, Plateforme ; M: Terrain & Collecte (Relances), Risque & Conformité (Recouvrement) | ✅ recouvrement | à créer (s'appuie sur notification-service + paiement-service) [À CONFIRMER] (à créer) | n°24 | Dev B | 27/11/2026 (lot 3) | non | Relances et Recouvrement IMF : une ou deux fiches ? [À CONFIRMER] |
| M20 | Conformité BCEAO, audit & LCB/FT | microfinance | M: Risque & Conformité, Plateforme | ✅ conformite-bceao | prospera-microfinance-service (prudentiel) (partiel) | n°27 | Dev B | 27/11/2026 (lot 3) | non (epics-microfinance) |  |
| M21 | Équipes & performance | distributeur, microfinance | D: Croissance & Équipes ; M: Croissance & Opérations (Équipes & Réseau) | ✅ equipe (déprécié, à réactiver) | à créer (à créer) | n°18 | Dev B | 04/12/2026 (lot 4) | non |  |
| M22 | Comptabilité & Finance (transactions) | distributeur, microfinance, assurance | D: Finance & Recouvrement ; M: Risque & Conformité (Finance & Comptabilité) ; A: offre unique (chaîne de règlement) | ✅ finance-transactions | à créer [À CONFIRMER] (cf. epics-comptabilite) (à créer) | n°21 | Dev B | 04/12/2026 (lot 4) | non (epics-comptabilite) | Le produit ne passe pas d'écritures de grand livre à ce jour |
| M23 | Marketing & campagnes | distributeur, microfinance | D: Croissance & Équipes ; M: Croissance & Opérations (Marketing & Acquisition) | ❌ marketing | à créer (à créer) | n°10 | Dev B | 04/12/2026 (lot 4) | non |  |
| M24 | Studio réseaux sociaux | distributeur | D: Croissance & Équipes, Plateforme | ❌ studio-social | à créer [À CONFIRMER] (à créer) | — (peut-être n°10) | Dev B | 04/12/2026 : **écrit le 2026-11-13**, `manifestes/studio-social.manifest.ts` (depends aucun ; droits à la forme élargie ; hors février, saisie manuelle seule) | oui (prd-distributeur, §5.6 et annexe A.6) | Peut fusionner avec Marketing [À CONFIRMER] |
| M25 | Contrôle de gestion | distributeur, microfinance [À CONFIRMER] | D: Plateforme (hors bundle) ; M: fondu dans le DAF | ❌ controle-gestion | à créer (à créer) | n°25 | Dev B | 04/12/2026 (lot 4) | non |  |
| M26 | Automatisations & Copilot IA | distributeur, microfinance | D: Croissance & Équipes ; M: Plateforme (IA native) | ❌ automatisations | assistant-service [À CONFIRMER] (à créer) | n°28 | Dev B | 04/12/2026 (lot 4) | non (voir Assistant IA) |  |
| M27 | Assistant IA & analyse de dossier (résumé, recherche sémantique, détection d'anomalies) | assurance | A: offre unique (phases 2-3) | ❌ assistant-ia | assistant-service (à créer) | — | Dev B | 04/12/2026 (lot 4) | oui (prd-assistant-ia) | Absent du plan ; PRD existant |
| M28 | Dashboard & pilotage | distributeur, microfinance, assurance, cabinet [À CONFIRMER] | D: Stock & Logistique, Plateforme ; M: Crédit ; A: offre unique (tableau de bord direction) | ✅ dashboard (déprécié, à réactiver) | à créer (à créer) | n°29 | Dev B | 04/12/2026 (lot 4) | non |  |
| M29 | Expertises & intervenants (experts, médecins, portail expert) | assurance | A: offre unique | ❌ expertises | prospera-assurance-service (à étendre) (partiel) | — | Dev B | 04/12/2026 (lot 4) | non |  |
| M30 | Production & polices | assurance | A: offre unique (reprise clients/polices) | ✅ assurance (décision du PO, 2026-11-12) | prospera-assurance-service (contrats) (existant) | — | Dev B | 20/11/2026 | non (epics-assurance) | Couvert par `assurance` (décision du PO, 2026-11-12) : pas de code `polices`, un seul manifeste avec M31 ; la cible de reprise des polices est `assurance` |
| M31 | Comptes techniques, provisions & réassurance CIMA | assurance | A: pack assurance-cima | ✅ assurance | prospera-assurance-service (existant) | — | Dev B | avec le PRD assurance (décision du PO, 2026-11-12) | non (epics-assurance) | Palier 2 (EPIC-131) hors cadrage. Le manifeste attend le PRD assurance, qui découpera les modules (comptabilité CIMA, sinistres, polices) |
| M32 | CRM Emprunteurs, KYC & membres | microfinance | M: Crédit, Plateforme | ✅ microfinance (décision du PO, 2026-11-12) | prospera-microfinance-service (membres) + kyc-service [À CONFIRMER] (partiel) | — | Dev B | avec le PRD microfinance (décision du PO, 2026-11-12 : le service actuel est surtout le paquet SFD) | non (epics-microfinance) | Couvert par `microfinance` (décision du PO, 2026-11-12). ⚠️ Le dépôt actuel porte surtout la partie comptable (paquet SFD) : pas de rétro-saisie, le PRD microfinance découpera |
| M33 | Encaissements & PI-SPI (liens de paiement, Mobile Money) | distributeur, microfinance | D: Finance & Recouvrement, Plateforme ; M: Terrain & Collecte (Caisse & Mobile Money) [À CONFIRMER] | ❌ paiement (décision du PO, 2026-11-12) | prospera-paiement-service (existant) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/paiement.manifest.ts` | oui (prd-paiement-service) | `paiement` = les paiements ET les moyens de paiement ; PI-SPI est un moyen de paiement, pas un module (décision du PO, 2026-11-12). `paiement` n'est pas semé au catalogue (déclaré à la main par la recette) ; `pi-spi` à retirer de l'offre (`DEPRECATED`, comme `fiscalite`) et à remplacer par `paiement` dans les packs |
| M34 | Canaux & notifications (WhatsApp, SMS, e-mail) | distributeur, microfinance, assurance, cabinet | Transverse, non vendu seul [À CONFIRMER] | ❌ notification | prospera-notification-service (existant) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/notification.manifest.ts` | oui (prd-notification-service) | À détenir par Money Vibes à l'amorçage (fait par STORY-728) ; pas semé au catalogue (déclaré à la main par la recette) |
| M35 | Atelier de balance | distributeur, microfinance, assurance, cabinet | Pack de chaque vertical | ✅ balance | balance-service (existant) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/balance.manifest.ts` (rétro-saisie ; le service porte aussi le conseil et les immobilisations sous la gate `balance`) | oui (prd-atelier-balance) | Rétro-saisie du manifeste |
| M36 | Bilan comptable & prévisionnel | distributeur, microfinance, assurance, cabinet | Pack de chaque vertical | ✅ bilan | bilan-service (existant) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/bilan.manifest.ts` (rétro-saisie ; dépend de `balance`) | oui (prd-bilan-service) | Rétro-saisie du manifeste |
| M37 | Déclarations fiscales | cabinet | Pack cabinet | ✅ declarations | prospera-fiscal-service (existant) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/declarations.manifest.ts` (rétro-saisie ; dépend de `bilan`) | oui (prd-fiscalite) | Rétro-saisie du manifeste |
| M38 | Conseil fiscal | cabinet | Pack cabinet | ✅ conseil | balance-service (scénarios et justification, EPIC-AB-07) (existant, sans gate `conseil`) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/conseil.manifest.ts` (dépend de `balance`) | oui (prd-atelier-balance, AB-07 ; le PRD Fiscalité n'a aucune exigence de conseil) | ⛔ Codé dans balance-service derrière la gate `balance` : le conseil se donne avec la balance. Gate `CONSEIL_NOT_ENTITLED` à poser |
| M39 | Portail client cabinet & missions | cabinet | Option cabinet, phase 2 | ❌ portail-cabinet | à créer (à créer) | — | Dev B | 04/12/2026 (lot 4) | non |  |
| M40 | Immobilisations & amortissements | distributeur, cabinet [À CONFIRMER] | Pack de chaque vertical, avec `balance` | ✅ balance (décision du PO, 2026-11-12) | balance-service (immobilisations) (existant) | — | Dev B | 12/11/2026 : couvert par `manifestes/balance.manifest.ts` | oui (prd-atelier-balance) | Couvert par `balance` (décision du PO, 2026-11-12) : les immobilisations servent à faire le bilan ; pas de code `immobilisations` |
| M41 | Paie & déclarations sociales | microfinance, cabinet [À CONFIRMER] | Option non datée | ❌ paie | à créer (à créer) | — | Dev B | 04/12/2026 (lot 4) | non | Périmètre à trancher (décision ouverte) |
| M42 | Add-on Réseau Freelance | distributeur | Add-on (Grand et Moyen ; option des 4 bundles) | ❌ freelance | pdv-service (hôte du module, derrière sa gate ; décision du PO du 2026-11-13, D-24) | — | Dev B | 04/12/2026 : **écrit le 2026-11-13**, `manifestes/freelance.manifest.ts` (depends catalogue, pdv ; module installable vendu en add-on, FR-99, décision du PO du 2026-11-13, D-24) | oui (prd-distributeur, §5.7 et annexe A.7) | Add-on VENDU, module INSTALLÉ (FR-99 ; décision du PO du 2026-11-13, D-24) : manifeste propre ; `catalogue`, `reseau`, `pdv` le listent en `enrichiPar` |
| M43 | Connecteurs (logiciel du client : Odoo, logiciel d'IMF, plus tard celui d'un assureur) ; banques, Mobile Money, OTR et signature sont des intégrations de leurs modules métier (`paiement`, `fiscal`…), hors de ce module (amendement 2026-11-12, spine de Connecteurs, AD-27) | distributeur, microfinance, assurance, cabinet | Un seul module commercial, ajouté d'office dès que le contrat déclare un logiciel du client ; inclus dans la plateforme complète (décision du PO, 2026-11-11) | ❌ connecteurs | à créer (à créer) | — | Dev B | 13/11/2026 (avec sa spine) | oui (prd-connecteurs) | Chantier continu ; ~~requis en février (QA-3)~~ requis au premier contrat qui déclare un logiciel du client, plus en février (amendement 2026-11-12, spine de Connecteurs, AD-32) ; le manifeste reste dû le 13/11 |
| M44 | Reprise de données | distributeur, microfinance, assurance | Module installable, ouvert d'office dans l'essai du prospect (décision du PO, 2026-11-11) ; offre [À CONFIRMER] | ❌ reprise | `reprise-service` (dépôt neuf, spine `architecture-reprise-donnees-2026-11-11`) | — | Dev B | 13/11/2026 (avec sa spine) : **écrit le 2026-11-11**, `manifestes/reprise.manifest.ts` | oui (prd-reprise-donnees) | Requis en février (QA-3) ; module d'écran `reprise` dans `prospera-app` |
| M45 | Consolidation des comptes de groupe | cabinet | Option du pack cabinet [À CONFIRMER] | ❌ consolidation | bilan-service (consolidation, EPIC-137 → 141) (existant, sans gate `consolidation`) | — | Dev B | 20/11/2026 : **écrit le 2026-11-12**, `manifestes/consolidation.manifest.ts` (dépend de `bilan`) | non (epics-consolidation) | Module à part (décision du PO, 2026-11-12) ; aujourd'hui sous la gate `bilan` : gate `CONSOLIDATION_NOT_ENTITLED` à poser |

## Récapitulatif

Total : **45 modules** (M44 Reprise de données ajouté le 2026-11-11 ; M45 Consolidation le 2026-11-12, décision du PO).

Les manifestes s'écrivent dans `prospera-stories/manifestes/<code>.manifest.ts` (premier écrit : `reprise.manifest.ts`, le 2026-11-11). Un module qui reçoit des données reprises déclare **`objetsDeReprise`** dès l'écriture de son manifeste (C1, amendement du 2026-11-11) : pour février, `pdv`, `catalogue`, `reseau`, `stock`, `facturation`, `polices` (reçues par `assurance`, décision du PO du 2026-11-12) et `sinistres` (spine de la Reprise, AD-23).

**Amendement (2026-11-12, spine de Connecteurs, AD-2, AD-11, AD-12 et AD-32).** La liste de sept modules ci-dessus n'est plus présumée : elle devient « **chaque module cible de février, jusqu'à une trentaine** ; schémas d'objets écrits avec les manifestes du 20/11 », chaque manifeste tranchant son cas (le point d'import est dans la définition de « fini » de chaque cible). Chaque module cible déclare en outre à son manifeste **`domainesEchange`** (C1, amendement du 2026-11-12), avec `publie` (les faits de domaine qu'il émet) et `consomme: connecteurs.domaine.changed@1`, et applique la règle du **point d'écriture unique** par domaine : une fonction de service par domaine déclaré, dont les faits portent l'identifiant stable de l'objet et un `rang`.

Par vertical (un module partagé compte dans chacune de ses verticales) :

- distributeur : 27
- microfinance : 26
- assurance : 15
- cabinet : 12

Code catalogue existant ✅ : **22** sur 45 (dont 3 dépréciés à réactiver : support-client, equipe, dashboard ; M17 et M30 rattachés à un code existant le 2026-11-12 ; M40 rattaché à `balance` et M33 passé à `paiement`, non semé, le 2026-11-12) ; à créer : 23.

**Décisions du PO du 2026-11-12 (codes partagés).** `polices` (M30) est couvert par `assurance` (M31) et `epargne` (M17) par `microfinance` (M32) : un code, donc **un seul manifeste** pour chaque paire. Les 18 modules codés et de la démo donnent **16 manifestes**. ⚠️ Le dépôt `prospera-microfinance-service` porte surtout la partie comptable : le manifeste `microfinance` décrit ce qui existe, la partie membres/KYC reste à coder.

Par propriétaire : **Dev B = 45** (décision du PO du 2026-11-11 ; M45 ajouté le 2026-11-12).

Manifestes datés : **45 sur 45, tous au plus tard le 04/12/2026** (décision du PO du 2026-11-11) : 2 cette semaine (Reprise, Connecteurs), ceux des modules déjà codés et de la démo le 20/11, les autres avec le PRD de leur lot. Seul le manifeste est avancé : le code de la plupart des modules reste après le 15/01.

## Points [À CONFIRMER]

Modules portant au moins un marqueur : **25** (27 avant les décisions du 2026-11-12). Détail :

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
- M18 Risque, PAR & provisionnement : bundles
- M19 Relances & Recouvrement : service, remarque
- M22 Comptabilité & Finance : service
- M24 Studio réseaux sociaux : service, remarque
- M25 Contrôle de gestion : verticales
- M26 Automatisations & Copilot IA : service
- M28 Dashboard & pilotage : verticales
- M32 CRM Emprunteurs, KYC & membres : service
- M33 Encaissements & PI-SPI : bundles, code, remarque
- M34 Canaux & notifications : bundles
- M40 Immobilisations & amortissements : verticales, bundles
- M41 Paie & déclarations sociales : verticales
- M42 Add-on Réseau Freelance : remarque
- M44 Reprise de données : bundles

## Hors liste

- `fiscalite` (déprécié au catalogue, remplacé par `declarations` et `conseil`) et le socle (auth, catalogue, moteur d'installation, coque `prospera-app`) ne sont pas des modules commerciaux.
- L'offre assurance v4 ne détaille pas de modules : les lignes A sont déduites de ses phases 1-3 et du lot 4 du plan.
