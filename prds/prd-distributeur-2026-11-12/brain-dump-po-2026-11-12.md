---
title: Brain dump du PO — PRD Distributeur
date: 2026-11-12
source: message du PO (collé), conversation du 2026-11-12
---

# Brain dump du PO (2026-11-12)

Consignes du PO qui accompagnent ce texte :
- le front de démo `prospera-distributeur` définit ce qu'on veut ; le PRD couvre **tout ce que la démo présente** ;
- moyens de paiement : **PI-SPI et FedaPay** (pas PI-SPI seul) ;
- l'export vers Sage se fera **après** ; pour le moment, rendre le projet **démontrable avec de vraies données de test et des parcours concrets**.

## 1. Le distributeur et le client de février

Prospera Distributeur sert à piloter un distributeur ou un grossiste au Togo et dans l'UEMOA. Il couvre le terrain, les commandes, le stock, la facturation, le recouvrement, le marketing et la finance. L'outil prévoit 14 rôles, du DG au commercial freelance, et 18 modules regroupés en 4 bundles.

Le client de février est Tampico. Nous sommes en pré-contrat. Tampico quitte Sage et sera hébergé chez Money Vibes. Je ne connais pas encore sa taille : nombre de commerciaux, de points de vente, de factures par mois et d'entrepôts. Ces chiffres sont à obtenir au prochain rendez-vous.

L'état réel de la démo : c'est un prototype avancé, avec 23 écrans et environ 47 600 lignes de code. En revanche, rien n'est enregistré. Il n'y a ni serveur ni base de données, et tout ce qu'on saisit disparaît quand on recharge la page.

## 2. Ce que Tampico doit pouvoir faire le premier jour

**Reprise depuis Sage, avant le démarrage**
- Le fichier clients, avec les conditions de paiement et les plafonds de crédit.
- Les articles et les tarifs, y compris les prix propres à chaque client.
- Les factures encore impayées à la date de bascule, pour que la balance clients soit juste dès le premier jour.
- La numérotation des factures, qui reprend la suite de Sage sans trou ni doublon.

**Commande**
- Saisir une commande avec vérification du stock, puis la valider.
- Produire le bon de livraison.
- Transformer la commande en facture en un clic.

**Facturation**
- Des factures conformes (mentions légales, TVA 18 %), numérotées dans l'ordre.
- L'impression et l'envoi en PDF.
- Les avoirs.
- L'enregistrement des paiements, y compris partiels.
- La balance clients et la balance âgée.

**Ce qui n'est pas demandé pour février** : la facture normalisée OTR n'est pas exigée. La certification viendra plus tard.

**Sage** : Tampico peut garder Sage s'il le souhaite. Dans ce cas, Prospera doit exporter les factures et les paiements dans un format que Sage sait importer, pour que sa comptabilité continue d'y tourner. *(Différé par le PO le 2026-11-12.)*

Le risque principal : aucun de ces points ne fonctionne sans un serveur et une base de données. C'est le chantier n° 1 avant février.

## 3. Les modules présents dans la démo, et ce qui agace

Les modules marqués ★ sont ceux dont Tampico a besoin en février. Les problèmes cités viennent de l'audit de la démo réalisé en juillet 2026.

### Terrain et ventes
1. **CRM Points de vente ★** — fiche complète par détaillant : GPS, photo, historique d'achats, score de santé 0-100 ; parcours prospect → client fidèle → à risque ; segmentation actifs / dormants / VIP ; carte de couverture. *Agace* : un commercial voit la fiche avec l'étiquette « Vue DG » (classement de zone, priorités du DG) au lieu de sa dernière visite, ses relances et son objectif du mois.
2. **Commercial terrain et tournées** — carte de l'équipe en temps réel, plan de journée, missions, taux de visites converties en commandes, optimisation d'itinéraire, clôture de visite, remises d'espèces et écarts de caisse. *Agace* : « Y aller » et « Clôturer » ne font rien ; une visite ne se déroule pas jusqu'au bout.
3. **Mon activité et disponibilité (côté commercial)** — la journée du commercial et la disponibilité des produits avant commande ; base de la future application mobile, hors connexion, compte-rendu vocal. *Agace* : « Ajouter au panier » ne fait rien ; ni application mobile ni hors connexion.
4. **Catalogue et prise de commande ★** — catalogue avec prix, disponibilité, promotions ; suivi des commandes brouillon → livrée, vérification du stock avant validation, marge calculée ; prix société et prix freelance distincts ; commande par WhatsApp. *Agace* : « Nouvelle commande terrain » ne fait rien.
5. **Conquête et territoires** — zones non couvertes, carnet de prospects, suivi des ouvertures (actif à 1 mois, à 3 mois), passation du nouveau client au commercial du secteur. *Agace* : « Transférer » ne fait rien.

### Stock et logistique
6. **Stock ★** — stock par entrepôt (Lomé Port, Kara), ruptures et surstocks, transferts proposés entre entrepôts, plans de liquidation. *Agace* : « Lancer la navette » et « Lancer le scénario » ne font rien.
7. **Opérations entrepôt** — préparation des commandes, chargement des camions, réceptions et litiges, inventaire tournant, contrôle au quai. *Agace* : contrôle au quai pré-rempli à 93 % ; valider un inventaire ne corrige pas le stock.
8. **Approvisionnement et fournisseurs** — registre des fournisseurs, réapprovisionnement proposé automatiquement, note de chaque fournisseur, commandes fournisseurs suggérée → reçue ; DAF alerté si un achat fait passer la trésorerie sous le plancher. *Agace* : valider une commande fournisseur ou une réception ne fait que simuler ; « Basculer sur le fournisseur alternatif » ne fait rien.

### Finance et recouvrement
9. **Facturation, proformas et e-facture ★** — factures et créances, proformas (avec probabilité d'acceptation), avoirs, plafonds de crédit, marge par facture, suivi des factures électroniques transmises / certifiées / rejetées. *Agace* : « Imprimer / PDF » ne fait rien ; « Envoyer au client » et « Convertir en commande » simulent ; « Relancer » une proforma ne fait rien ; « Corriger et retransmettre » simule.
10. **Encaissements ★** — paiements reçus, liens de paiement mobile (PI-SPI, FedaPay), rapprochement automatique facture ↔ paiement, remises d'espèces du terrain. *Agace* : aucun paiement réel ; rien n'est branché ni conservé.
11. **Relances et recouvrement ★** — dossiers de relance, escalade WhatsApp → SMS → visite → direction, balance âgée, promesses de paiement, blocage du crédit. *Agace* : dans un dossier on peut seulement le fermer ; ni relance, ni paiement, ni visite ; bloquer le crédit simule.
12. **Comptabilité** — écritures SYSCOHADA générées depuis les factures, lettrage, TVA, factures d'achat, clôture. *Agace* : lettrage et saisie des factures d'achat simulent ; « Télédéclarer sur le portail OTR » ne fait rien.
13. **Pilotage financier (DAF)** — trésorerie à 7 jours, BFR, marge par canal, décisions de crédit, choix des fournisseurs à payer cette semaine. *Agace* : « Payer », « Accorder », « Refuser » simulent ; « Générer les ordres de virement » ne fait rien.
14. **Contrôle de gestion** — budgets par zone, canal, famille ; budget / réel / projection ; compte de résultat par axe ; prévision glissante 3 mois ; rapports préparés et envoyés au DG et au DAF.

### Pilotage et croissance
15. **Tableau de bord et pilotage** — tableau de bord par rôle, alertes du jour, décisions à trancher, rapport de direction rédigé par l'IA. *Agace* : bandeau « alertes critiques », « PDF », « Envoyer » ne font rien ; décisions du DG ni validées ni reportées.
16. **Objectifs et quotas** — répartition par zone, projection de fin de mois, mix produits et marge.
17. **Équipes et performance** — indicateurs individuels, classements, coaching, salariés / freelances. *Agace* : le responsable des ventes et le superviseur voient la « Vue DG » ; « Valider » / « Refuser » des demandes de remise ne font rien.
18. **Marketing et campagnes** — campagnes et ROI, promotions construites depuis le stock à écouler (« combos stock »). *Agace* : « Lancer », « Modifier », « Ignorer » ne font rien ; suggestions au DG sans validation. Seul circuit de bout en bout de la démo : les combos stock.
19. **Studio réseaux sociaux** — calendrier des publications (WhatsApp, Facebook, TikTok, Instagram), accroches proposées par l'IA, boîte de réception unique. *Agace* : « Valider et programmer » et « Envoyer » ne font rien.
20. **Automatisations** — règles appliquées seules par l'IA, soumises à validation, suggérées ; journal de la nuit. *Agace* : aucun « Valider » ni « Reporter » ; activer une règle est perdu au rechargement.

**En résumé** : l'analyse et les rapports sont riches et propres à chaque rôle. La partie qui sert à agir ne fonctionne pas encore : sur les 36 boutons relevés par l'audit, aucun n'agit vraiment ni n'enregistre quoi que ce soit.

## 4. Documents

Dans le dépôt `prospera-font-end` :
- Inventaire des modules et bundles : `docs/prospera_modules_bundles_distributeur.md`
- Ordre de livraison et état de chaque module : `docs/PROSPERA_MODULES_ET_ROADMAP.md`
- Audit des boutons et des rôles : `prospera-distributeur/docs/AUDIT_PERSONAS_AMELIORATIONS.md`
- Spécification V2 : `prospera-distributeur/docs/spec-v2-pilotage-personas-fournisseurs.md`
- Grille tarifaire : `prospera-distributeur/docs/prospera_pricing_distribution.md`
- Résumé commercial : `prospera-distributeur/docs/RESUME_OUTIL_DE_PILOTAGE_DISTRIBUTEUR.md`
- Fiches par rôle : `prospera-distributeur/docs/personas/`
- Guide utilisateur : `prospera-distributeur/docs/guide-utilisateur/`

Pas de maquettes séparées : la démo sert de maquette (localhost:3002, compte de démo du DG).

Pas encore disponibles : notes de rendez-vous avec Tampico ; exports Sage (clients, articles, factures ouvertes, modèle de facture) ; messages WhatsApp.
