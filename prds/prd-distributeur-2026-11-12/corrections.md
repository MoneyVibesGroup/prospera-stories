---
title: Feuille d'arbitrage des corrections — PRD Distributeur
date: 2026-11-12
sources: triage-hypotheses-1.md, triage-hypotheses-2.md, reconcile-po.md, reconcile-demo-operations.md, reconcile-demo-finance-pilotage.md, review-rubric.md, review-adversarial.md, .memlog.md
---

# Feuille d'arbitrage

Cette feuille tranche les conflits entre les sept rapports. Elle **l'emporte** sur eux. Les décisions du PO (`.memlog.md`) l'emportent sur elle.

## 1. Règles de travail

- **Numérotation des ajouts** : pas de « FR-n bis ». Partie 1 : FR-20 à FR-29. Partie 3 : FR-172 à FR-179. Partie 2 : FR-220 à FR-239. Partie 4 : FR-240 à FR-259. Un numéro existant ne change jamais.
- **Hypothèses** : appliquer les remplacements des fichiers de tri (`CONFIRMÉE` et `DÉFAUT` : la marque disparaît et le texte devient affirmatif, « par défaut, modifiable » quand c'est un défaut). Les `QUESTION PO` gardent leur marque, réécrite au format `[QUESTION PO Qn : …]` avec le n° de la question du §12 (liste au §4 ci-dessous). Les colonnes IMF et assurance de la partie 3 prennent une seule mention par tableau : « *Colonnes IMF et assurance : propositions, à valider par les PRD microfinance et assurance.* » et les marques de cellule disparaissent.
- **Le client de février n'est jamais nommé.**
- **Vocabulaire** : celui du §3 du PRD. « Bon de commande » désigne le bon de livraison émis à la validation (sur lequel sort le camion) ; la commande au fournisseur s'appelle toujours « commande fournisseur ».

## 2. Arbitrages (A1 → A34)

- **A1, Créance.** Un seul propriétaire : `paiement` (registre unique). `facturation` publie ses faits (facture émise, avoir émis) ; `paiement` ouvre et réduit la Créance en les consommant ; `recouvrement` la lit. Aucun test « au même instant » entre deux services : la Créance reflète la facture en moins de 5 s. `facturation` dépend dur de `paiement` (`depends`). Corriger FR-49 à FR-52, A.2 (C3, C5), A.9, et ajouter en §7.5 l'exigence qui dit que `paiement` porte la Créance (amendement du PRD paiement : tiers, source, périmètre, composantes).
- **A2, Encours.** Encours d'un tiers = créances ouvertes + commandes validées non encore facturées − crédit du tiers (A3). Le plafond de crédit se juge sur l'encours. Corriger FR-33, FR-52, FR-187.
- **A3, Argent sans facture.** Un encaissement qui n'a pas (encore) de créance devient un **crédit du tiers** (avance, acompte, trop-perçu) tenu par `paiement`. Il est imputé ensuite : affectation explicite d'abord, sinon la créance échue la plus ancienne. Un paiement déjà reçu chez PI-SPI ou FedaPay n'est **jamais refusé** : l'excédent devient crédit du tiers (remboursable ou imputable). Un avoir sur une facture payée crée un crédit du tiers. Corriger FR-48, FR-49, FR-104, FR-111, UJ-2.
- **A4, Seuils de retard (une seule table, paramétrable).** J+1 : rappel ; J+30 : alerte à la direction ; > 60 j de créance échue ou encours > plafond : **blocage automatique du crédit** (règle auditée, exception explicite à FR-158) ; déblocage jamais automatique (DAF). Une commande est refusée si le crédit est bloqué ou si l'encours dépasse le plafond. Supprimer 45 j et 75 j partout. Les 5 tranches de balance âgée restent.
- **A5, Escalade.** L'échelle par défaut de FR-114 fait foi. UJ-1 dit : « Le lendemain de l'échéance, un rappel part par WhatsApp » (pas « le 15 »).
- **A6, TVA.** La TVA se calcule **par taux, sur le total HT de la facture**, avec un seul arrondi par taux (règle écrite) ; le taux vient du paquet fiscal du pays, jamais en dur. NFR-2 et FR-45 disent la même chose.
- **A7, Géofencing.** Une clôture hors du rayon (200 m) reste possible, avec un **motif obligatoire**, et elle est signalée au superviseur. Corriger le tableau de FR-13 et FR-102.
- **A8, Marge minimale du freelance.** Avertit, ne bloque pas (FR-93) ; FR-127 s'aligne.
- **A9, Rémunération du freelance (une seule définition).** Commission = taux × montant **au prix société** de ses ventes, acquise à la facturation ; la marge de négociation est à lui, privée. Aucune exigence ne dit que sa marge est sa rémunération vue de la société (FR-126) ; la commission des salariés se calcule sur l'encaissé (FR-128, défaut) ; celle du freelance suit FR-98. Fuites à fermer : la conversion proforma → commande (FR-56), le PDF remis au détaillant (il porte le prix freelance seul, jamais le prix société), le score de poste. Libellé : « prix société », jamais « coût d'achat ». Le modèle exact (achat-revente ou vente pour le compte de la société) est la **question Q1** : écrire de façon compatible avec les deux, en marquant les passages qui en dépendent `[QUESTION PO Q1]`.
- **A10, Ce que les deux parcours n° 1 exigent n'est jamais « bientôt ».** L'envoi de la facture par WhatsApp (le module `notification` existe) et l'application terrain Flutter hors connexion sont **exigés**. Ajouter ce qu'il faut pour que le prospect joue UJ-2 en essai : distribution de l'application, connexion par rôle dans l'essai, positions GPS des points de vente du jeu proches d'un lieu de démonstration (ou un mode « démonstration » qui simule la position de façon visible).
- **A11, Modules ★ (besoins du client de février).** `commande`, `facturation`, `paiement` (encaissements), `recouvrement`, `pdv`, `catalogue`, `stock`, et `terrain` (UJ-2). Les marquer ★.
- **A12, Rien ne se perd pour les documents numérotés et l'argent confirmé.** NFR-1 : factures, avoirs, bons numérotés et encaissements confirmés ne se perdent jamais (aucune perte admise pour eux) ; la perte maximale d'une heure ne vaut que pour le reste.
- **A13, Comptabilité de référence en février** : **question Q2**. Défaut d'écriture : `finance-transactions` produit les écritures et soumet une balance à `balance` ; le grand livre de référence est à décider par le PO.
- **A14, Rôles fantômes.** Pas de « chargé de bureau », « chargé de facturation », « chauffeur ». Saisie d'une commande au bureau : tout rôle qui a le droit de saisir une commande (DC, RESP_VENTES, COMMERCIAL, COMPTABLE). Création et émission d'une facture : COMPTABLE et DAF. Confirmation de livraison : GEST_ENTREPOT ou l'agent de terrain. Dans UJ-1, Akossiwa est **comptable**.
- **A15, Matrice d'accès.** Ajouter une **annexe B** : rôles × écrans (reprise de `route-access.ts`, extrait pilotage §1.1, corrigée par FR-6 à FR-8) et, par module, rôles × droits proposés.
- **A16, Réservation et crédit bloqué.** La réservation se fait à la validation. Si le crédit est bloqué après validation, la réservation reste jusqu'à l'annulation ou au déblocage ; au-delà de 7 jours (défaut), une alerte va au responsable des ventes. L'allocation du matin par priorité ne porte que sur les commandes **en attente de stock** : **question Q3** pour confirmer.
- **A17, Quantités facturées** = quantités **livrées confirmées** (pas « servies » ambigu).
- **A18, Prospect.** Un prospect est un point de vente à l'état `PROSPECT` ; sa première commande passe sous le garde-fou de 1,5 M.
- **A19, Appareil perdu.** La déconnexion à distance n'efface la file d'envoi qu'après l'avoir transmise ou exportée ; des encaissements non transmis ne disparaissent jamais en silence (ils sont signalés au superviseur).
- **A20, Décision à trancher.** Chaque module possède ses décisions (même schéma, FR-14) ; `dashboard` les liste, il ne les possède pas.
- **A21, Dossier de recouvrement** : un par tiers (il liste ses créances), par défaut.
- **A22, KPI de poste** de RESP_STOCK et GEST_ENTREPOT : les ajouter à FR-122 (valeurs de l'extrait pilotage §1.3).
- **A23, Partie 3 prête pour la microfinance.** Ajouter une section **§6.0 « Ce que le noyau prévoit pour les autres verticales »** : Créance à **composantes** (principal, intérêt, pénalité, frais), PAR calculé sur l'encours entier, **épargne et dépôts** comme encaissements sans créance, **groupe solidaire** comme tiers collectif avec caution mutuelle, **blocage du crédit** porté par le noyau (pas par `pdv` seul). Ce sont des capacités du noyau à valider par le PRD microfinance.
- **A24, UJ.** Ajouter **UJ-9 « Le freelance qui négocie »** (prix société 14 000 F, vendu 15 000 F, commission sur 14 000 F, il doit 14 000 F même si son client ne paie pas) ; FR-93 à FR-99 le réalisent. UJ-8 est réalisé par FR-9 à FR-12 et FR-2. Retirer les « Réalise UJ-5 » qui n'ont rien à voir avec le lundi du DG ; nommer les protagonistes de UJ-4 à UJ-7.
- **A25, Logistique.** Ajouter à l'article (renvoi catalogue) poids, volume, unités par palette ; objets camion (capacité) et préparateur ; capacités des entrepôts et heures de départ (15:30, 14:00 dans la démo) au jeu de démonstration.
- **A26, Règles chiffrées perdues** (transferts entre entrepôts, santé du stock, plan de liquidation, rentabilité et engouement du catalogue) : les porter en §7.4 (stock) et §7.3 (catalogue) comme exigences d'amendement, avec les constantes de l'extrait ; « Lancer la navette » et « Lancer le scénario » appartiennent à `stock` (amendement) — ils ne restent pas sans propriétaire.
- **A27, Terrain.** Ajouter : génération du plan de journée (fréquence par segment, ordre, horaires, motif « relance d'impayé » à 7 jours) ; alertes de tournée (couverture < 80 %, conversion < 40 % au-delà de 5 visites) ; les 5 critères d'exécution en magasin avec leurs cibles (90, 95, 80, 75, 100 %) saisis à la clôture.
- **A28, Finance.** Ajouter le rapprochement bancaire d'un compte de trésorerie (il fonde le KPI du comptable).
- **A29, Facturation.** Ajouter les chiffres des onglets Factures (8) et Proformas (6), le lien de paiement (PI-SPI, FedaPay) dans l'envoi de la facture, et la facture **émise par le freelance** (sa série, l'émetteur, ses mentions).
- **A30, Contrôle de gestion.** FR-53 et FR-156 : le contrôleur voit la marge par axe, pas la marge de chaque facture.
- **A31, Périmètre.** « Tout, sans ordre ni date » est une décision du PO : la noter au §12 comme **risque assumé**, avec la conséquence (planification au découpage en épics).
- **A32, Sage ou Odoo.** Tranché par le PO : le client quitte Sage. Le document tarifaire qui dit « Odoo complet » est à corriger ; ce n'est plus une question.
- **A33, `support-client` (M03).** Section courte sans exigence, absent de la démo : conserver tel quel.
- **A34, §12 et §13.** §12 devient un tableau des questions restantes (n°, question, recommandation, qui répond, échéance : avant la spine / avant les stories / avant février) + les décisions prises + les risques assumés. §13 est régénéré par l'animateur après assemblage.

## 3. Ce que chaque rédacteur corrige

| Fichier de section | Rédacteur | Contenu |
|---|---|---|
| `sec-1-tronc.md` | 1 | §0 à §4 et §8 à §12 ; UJ-9 ; vocabulaire ; FR-1 à FR-29 ; NFR ; SM ; §12 (A34) |
| `sec-2-partie2.md` | 2 | §5 entier (FR-30 à FR-99, ajouts FR-220 à FR-239) |
| `sec-3-partie3.md` | 3 | §6 entier (FR-100 à FR-171, ajouts FR-172 à FR-179, §6.0) |
| `sec-4-partie4-annexes.md` | 4 | §7 (FR-180 à FR-219, ajouts FR-240 à FR-259), annexe A, annexe B (nouvelle) |

## 4. Questions au PO (numéros à utiliser dans les marques)

- **Q1** : le freelance achète-t-il le stock pour le revendre, ou vend-il pour le compte de la société (le stock reste à la société jusqu'à la livraison) ? Recommandation : vente pour le compte de la société.
- **Q2** : en février, où est tenue la comptabilité de référence du client : dans Prospera, ou encore dans Sage ? Recommandation : Prospera produit écritures et balance ; Sage seulement si le client le garde, par l'export (après).
- **Q3** : la réservation à la validation et l'allocation du matin par priorité cohabitent-elles (l'allocation ne portant que sur les commandes en attente de stock) ? Recommandation : oui.
- **Q4** : les prix propres à chaque client vivent-ils dans une grille « ce client » du catalogue (amendement du PRD catalogue) ? Recommandation : oui.
- **Q5** : consignes de bouteilles et casiers hors v1 ? Recommandation : oui.
- **Q6** : mentions légales de la facture et conservation : validation par l'expert-comptable du client. Recommandation : liste de travail jusque-là.
- **Q7** : position GPS des agents : consentement et conservation ? Recommandation : information à l'embauche, conservation 90 jours glissants, avis juridique.
- **Q8** : commission des salariés sur l'encaissé ou sur le facturé ? Recommandation : encaissé (le freelance reste sur le prix société facturé).
- **Q9** : qui calcule le score de santé d'un point de vente au premier jour ? Recommandation : une règle de `dashboard`, déposée dans `pdv` avec sa provenance.
- **Q10** : paiement des fournisseurs : les ordres sont exigés ; la transmission réelle part dès que le raccordement de l'organisation est fait. Recommandation : oui.
- **Q11** : dépendances dures : une commande exige un point de vente (pas de vente comptoir anonyme) ? Recommandation : oui, un « client comptoir » générique par point de stock couvre le comptoir.
- **Q12** : conservation des messages WhatsApp des clients et consentement : alignés sur le PRD notification §9.2 ? Recommandation : oui.


## 5. ✅ Réponses du PO (2026-11-12) : toutes les questions sont TRANCHÉES

Plus aucune marque `[QUESTION PO …]` ne doit rester : chaque passage s'écrit comme une décision, en citant « décision du PO du 2026-11-12 ».

- **Q1 → vente pour le compte de la société.** Le stock reste à la société jusqu'à la livraison au détaillant. Le freelance vend et facture le détaillant au prix qu'il négocie ; il doit le prix société à la société, même si son détaillant ne paie pas ; la société lui verse une commission calculée sur le prix société ; la marge de négociation est à lui, invisible de la société. Le freelance n'achète pas de stock : supprimer « Mes commandes grossiste » comme achat, la « commande à double flux » devient une vente du freelance servie par le stock de la société.
- **Q2 → la comptabilité n'est PAS considérée pour février** (après). Les exigences de `finance-transactions` restent dans le PRD mais hors du périmètre de février ; aucune comptabilité de référence n'est exigée en février.
- **Q3 → oui** : la réservation se fait à la validation ; l'allocation du matin par priorité ne porte que sur les commandes en attente de stock.
- **Q4 → oui** : grille « ce client » dans le catalogue (amendement du PRD catalogue).
- **Q5 → oui** : consignes de bouteilles et casiers hors v1.
- **Q6** : la liste des mentions légales est une liste de travail jusqu'à la validation par l'expert-comptable du client (action du PO, avant la recette de la facture).
- **Q7** : position GPS des agents : information à l'embauche, conservation 90 jours glissants puis purge ; avis juridique à obtenir.
- **Q8 → encaissé** pour les salariés ; le freelance reste sur le prix société facturé.
- **Q9** : le score de santé d'un point de vente au premier jour est une règle de `dashboard`, déposée dans `pdv` avec sa provenance.
- **Q10 → oui** : les ordres de paiement aux fournisseurs sont exigés ; la transmission réelle part dès que le raccordement de l'organisation est fait.
- **Q11 → oui** : une commande exige un point de vente ; un « client comptoir » générique par point de stock couvre la vente au comptoir.
- **Q12 → oui** : conservation des messages WhatsApp et consentement alignés sur le PRD notification §9.2.
