---
title: "PRD — Prospera Distributeur"
status: draft
created: 2026-11-12
updated: 2026-11-12
project: prospera
verticales: [Distributeur, IMF (partie 3 partagée), Assurance (partie 3, si pertinent)]
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13)
prd_lies: [prd-reseau-zones-2026-08-02, prd-pdv-2026-08-02, prd-catalogue-produits-2026-08-02, prd-stock-2026-08-02, prd-paiement-service-2026-08-02, prd-notification-service-2026-08-02, prd-reprise-donnees-2026-11-10, prd-connecteurs-2026-11-10, prd-moteur-installation-2026-11-09]
mode: rapide
---

# PRD — Prospera Distributeur

*Brouillon rédigé en mode rapide le 2026-11-12, à partir du texte du PO (`brain-dump-po-2026-11-12.md`), de la 19ᵉ séance de la table ronde, et de cinq extraits du front de démo et des PRD existants (`extract-*.md`). Décisions et raisons dans `.memlog.md`. Les déductions sans source sont marquées `[ASSUMPTION]` et rassemblées au §13.*

---

## 0. Objet du document

Ce PRD décrit **Prospera Distributeur** : l'outil qui pilote un distributeur ou un grossiste au Togo et dans l'UEMOA, du terrain à la finance. Il s'adresse au PO, à Dev A et Dev B, et aux auteurs des PRD microfinance et assurance, qui s'écrivent juste après lui.

**Sa source est le front de démo** `prospera-font-end/prospera-distributeur` (23 écrans, environ 47 600 lignes). Le PO l'a décidé : ce que la démo présente, le produit doit le faire. Mais la démo n'enregistre rien. Elle n'a ni serveur ni base de données, ses indicateurs sont souvent des constantes, et sur les boutons d'action relevés par l'audit de juillet 2026, aucun n'agit vraiment. **Ce PRD exige donc tout ce que la démo montre, en vrai** : enregistré, relu par les autres rôles, calculé depuis les données saisies.

Le document est **unique** (décision du PO) et se lit en quatre parties :

| Partie | Contenu | Sections |
|---|---|---|
| **1. Le produit et ses deux moments** | vision, rôles, les deux parcours n° 1, le jeu de démonstration, les règles transverses (tout s'enregistre, boutons « bientôt », périmètres, garde-fous, chiffres vrais) | §1 à §4 |
| **2. Les modules propres au distributeur** | commande, facturation, approvisionnement, entrepôt, conquête et objectifs, studio réseaux sociaux, add-on Freelance | §5 |
| **3. Les modules partagés avec la microfinance** | écrits **une fois, neutres de verticale** : un noyau commun, puis un tableau de vocabulaire par verticale. Les PRD microfinance et assurance y renvoient au lieu de les réécrire | §6 |
| **4. Les modules déjà cadrés** | fiches de renvoi vers réseau, points de vente, catalogue, stock, paiement, notification, Reprise et Connecteurs, avec ce que la démo exige en plus | §7 |

Suivent les exigences transverses (§8), les indicateurs de réussite (§9), le périmètre (§10), les non-objectifs (§11), les questions ouvertes (§12), les hypothèses (§13), et en **annexe A** les 13 lignes du contrat de module pour chaque module.

**Numérotation des exigences.** FR-1 à FR-29 : partie 1. FR-30 à FR-99 : partie 2. FR-100 à FR-179 : partie 3. FR-180 à FR-219 : partie 4. Les numéros sont stables : une exigence retirée garde son numéro, barré. Ce brouillon compte **201 exigences** (FR-1 → FR-19, FR-30 → FR-171, FR-180 → FR-219) ; FR-20 → FR-29 et FR-172 → FR-179 sont libres. Les exigences des autres PRD se citent avec leur préfixe (`FR-C14`, `FR-P10`, `Reprise FR-9`, `Connecteurs FR-17`).

**Comment il a été écrit.** Mode rapide : la partie 1 par l'animateur ; les parties 2, 3 et 4 par trois rédacteurs à partir des extraits, avec le vocabulaire et les plages de numéros imposés, puis assemblées et vérifiées (numérotation sans doublon). Les déductions sans source (`[ASSUMPTION]`, environ 200) sont indexées au §13 ; les décisions bloquantes sont listées au §12.

---

## 1. Vision

Un grossiste de Lomé vend chaque jour à des centaines de boutiques par une douzaine de commerciaux, sort ses camions de deux entrepôts, et court après son argent. Aujourd'hui, il tient tout cela dans Sage, dans des cahiers et dans WhatsApp. Il ne sait pas, le soir, ce que ses commerciaux ont vraiment encaissé, ni quel client va payer, ni quel produit va manquer.

**Prospera Distributeur met tout le métier dans un seul outil, par rôle.** Le commercial déroule sa tournée sur son téléphone, même sans réseau, et sa commande arrive au bureau avec le stock vérifié. La facture sort juste, numérotée, avec la TVA, et part en PDF. Le client paie une partie par FedaPay ou par PI-SPI, et la balance âgée le sait aussitôt. La relance part au bon moment par le bon canal. Le DG ouvre lundi matin huit chiffres vrais et tranche les décisions qui l'attendent.

**Ce qui le distingue** : chaque rôle a son écran et ses chiffres, et la machine prépare le travail la nuit (réappro, relances, combos d'écoulement) sans jamais décider à la place d'un humain là où l'argent est en jeu.

**Pourquoi maintenant.** Un premier client, un grossiste en pré-contrat qui quitte Sage, doit démarrer en février 2027 sur les serveurs de Money Vibes. La démo a déjà convaincu ; il faut maintenant qu'elle **fasse ce qu'elle montre**. Et chaque prospect qui ouvrira un essai le 15/01 testera lui-même le produit.

---

## 2. Pour qui

### 2.1 Les rôles

Quatorze rôles, plus l'administrateur du distributeur. Les écrans de chaque rôle sont ceux de la table d'accès de la démo (`route-access.ts`), qui devient la règle (FR-5).

| Code | Rôle | Ce qu'il fait d'abord dans Prospera |
|---|---|---|
| `DG` | Directeur général | lit les 8 chiffres, tranche les décisions, reçoit les rapports ; ne saisit rien |
| `DC` | Directeur commercial | pilote le chiffre, la couverture et la marge de toute la force de vente |
| `RESP_VENTES` | Responsable des ventes | porte le quota d'une région : atterrissage, mix, marge |
| `SUPERVISEUR` | Superviseur de zone | suit les tournées, la caisse et l'exécution en magasin ; valide les remises |
| `COMMERCIAL` | Commercial terrain | visite, prend la commande, encaisse ; souvent hors connexion |
| `FREELANCE` | Commercial freelance | achète au prix société, revend à ses prix ; sa marge ne se voit pas |
| `PROSPECTION` | Chargé de prospection | ouvre les zones blanches, obtient la 1re commande, passe la main |
| `RESP_STOCK` | Responsable stock et logistique | garantit la disponibilité : ruptures, transferts, réappro |
| `GEST_ENTREPOT` | Gestionnaire d'entrepôt | prépare, charge, réceptionne, compte, dans **son** entrepôt |
| `DAF` | Directeur administratif et financier | tient la trésorerie, arbitre ce qui entre et ce qui sort |
| `COMPTABLE` | Comptable | saisit, rapproche, lettre, clôture |
| `CONTROLE_GESTION` | Contrôleur de gestion | fige les budgets, signale les écarts, envoie les rapports ; n'arbitre pas |
| `MARKETING` | Responsable marketing | lance les campagnes et les combos d'écoulement |
| `RECOUVREMENT` | Responsable recouvrement | traite la file du jour, relance, escalade, bloque le crédit |
| `DIST_ADMIN` | Administrateur du distributeur | crée les utilisateurs, leur donne un rôle et un périmètre, règle les garde-fous et les objectifs |

`DIST_ADMIN` n'existe ni dans la démo ni dans ses documents ; il vient de la décision du PO du 2026-08-03 (14 rôles + `DIST_ADMIN`, STORY-166).

### 2.2 Hors cible (v1)

- **Les points de vente eux-mêmes** (les détaillants) n'ont pas de compte. Ils reçoivent un message, un PDF ou un lien de paiement, et peuvent commander par WhatsApp, sans se connecter.
- **Le client final** (le consommateur) n'est pas dans le produit.
- **Le distributeur qui garde son logiciel** (Odoo) relève de Connecteurs, hors février.

### 2.3 Parcours clés

Les deux premiers sont les **deux moments qui comptent**, à égalité (décision du PO) : la première facture juste, et la première tournée finie.

> **UJ-1. La facture juste.**
> Lundi 8 h, Akossiwa, au service commercial du Grossiste du Golfe, saisit la commande de la boutique de Mme Adjo à Adidogomé : 20 cartons de jus d'orange 1 L, 10 packs de cola 33 cl. Prospera vérifie le stock à Lomé Port et le **réserve**. Elle valide ; le **bon de livraison** sort, le camion part. Mercredi, à la livraison, elle transforme la commande en **facture en un clic** : numéro suivant, sans trou, mentions légales, TVA 18 %. Le PDF part sur le WhatsApp de Mme Adjo. Le soir, Mme Adjo paie la moitié par **FedaPay** ; la facture passe « partiellement payée ». Le 15, la **relance** part par WhatsApp. Le 30, la **balance âgée** la classe dans la tranche 31-60 jours, et le **DG** la voit dans son rapport du mois. **Cas limite :** si Mme Adjo a dépassé son plafond de crédit, la validation de la commande est refusée avec le motif, et le DAF peut accorder une dérogation tracée.

> **UJ-2. La tournée finie.**
> Kodjo, commercial à Bè, ouvre l'application sur son Android d'entrée de gamme. Son plan de journée compte 14 visites. Il appuie sur **« Y aller »**, arrive chez un détaillant, vérifie la disponibilité des produits (sans voir les quantités), prend une commande au panier, encaisse 35 000 F en espèces, et **clôture** la visite, à moins de 200 m du point de vente. Le réseau coupe à la 9ᵉ visite : il continue. Le soir, au retour du réseau, tout part : les commandes arrivent « en attente de confirmation du stock », les espèces portent leur clé et ne comptent qu'une fois. Il fait sa **remise d'espèces** au superviseur. **Cas limite :** une commande saisie hors connexion sur un produit vendu entre-temps revient « stock insuffisant » et Kodjo est prévenu.

> **UJ-3. Le superviseur voit vrai.** Yawa, superviseure de Lomé Centre, voit la tournée de Kodjo telle qu'elle s'est passée : visites faites, commandes prises, espèces déclarées, **écart de caisse réel** entre ce qui est déclaré et ce qui est remis. Elle ne voit que ses commerciaux.

> **UJ-4. La file du jour.** Mensah, au recouvrement, ouvre sa file triée par ce qu'elle rapporte. Il envoie une relance WhatsApp, enregistre une promesse de paiement au 20, et bloque le crédit d'un client à 75 jours : sa prochaine commande sera refusée tant que le DAF n'aura pas débloqué.

> **UJ-5. Le lundi du DG.** Le DG lit ses 8 chiffres, ouvre les décisions à trancher, en valide deux et en reporte une, avec la trace. Il télécharge le rapport de direction en PDF et l'envoie au DAF.

> **UJ-6. Le réappro qui ne vide pas la caisse.** Le responsable stock voit trois réappros proposés. Il valide une commande fournisseur de 18 M ; au-delà de son plafond de 5 M, elle passe au DAF, qui la valide parce que la trésorerie reste au-dessus du plancher. À la réception, un écart de 6 % ouvre un litige, et le stock est corrigé de ce qui est réellement arrivé.

> **UJ-7. L'ouverture qui tient.** Le chargé de prospection recense une boutique en zone blanche, obtient une première commande sous le garde-fou de 1,5 M, puis la transfère au commercial du secteur. Un mois plus tard, puis trois, l'outil dit si l'ouverture tient.

> **UJ-8. Le prospect qui essaie.** Le 15/01, un prospect ouvre son essai avec le jeu « Grossiste du Golfe ». Il joue UJ-1 et UJ-2 lui-même, sans aide, ajoute ses propres articles, et recharge la page : tout est toujours là.

---

## 3. Vocabulaire

Les termes ci-dessous s'emploient tels quels dans tout le PRD et dans les documents qui en descendent. Les parties 3 et suivantes ajoutent leur vocabulaire par verticale.

- **Organisation** : le distributeur client de Prospera. Toutes les données lui appartiennent et en sont cloisonnées.
- **Rôle** : l'un des 15 rôles du §2.1. Un utilisateur en a un.
- **Périmètre** : la part des données qu'un utilisateur voit et modifie : tout, une région, une zone, un portefeuille (ses points de vente), ou un entrepôt.
- **Point de vente** : le détaillant (boutique, kiosque, supermarché) à qui le distributeur vend. Il porte un plafond de crédit et des conditions de règlement.
- **Tiers** : terme du noyau partagé (partie 3) pour celui qui doit de l'argent : le point de vente chez le distributeur, le membre à l'IMF.
- **Agent de terrain** : terme du noyau partagé pour celui qui visite : le commercial, le freelance, le chargé de prospection chez le distributeur.
- **Lieu** et **Zone** : un lieu a une adresse (entrepôt, agence, boutique) ; une zone est un périmètre commercial sans mur (PRD réseau).
- **Article** : un produit du catalogue, avec son unité de base et ses conditionnements (bouteille, pack, carton).
- **Grille de prix** : le prix société (grille non modifiable), le prix freelance, et le prix négocié avec un point de vente.
- **Commande** et **Ligne de commande** : ce qu'un point de vente achète, article par article.
- **Stock réservé** : la quantité qu'une commande validée bloque dans un point de stock.
- **Point de stock** : un entrepôt ou un dépôt (Lomé Port, Kara).
- **Bon de livraison** : le document qui accompagne la marchandise d'une commande.
- **Facture**, **Avoir**, **Proforma**, **E-facture** : les documents commerciaux de la partie 2.
- **Créance** : ce qu'un tiers doit. Une facture en ouvre une ; à l'IMF, une échéance de prêt en ouvre une. **Source de créance** : ce qui l'a ouverte.
- **Encaissement** : un paiement reçu, par un **moyen de paiement** : PI-SPI, FedaPay (Mobile Money compris), espèces ou virement déclarés. Les encaissements appartiennent au module `paiement`.
- **Remise d'espèces** et **Écart de caisse** : ce qu'un agent de terrain remet de ce qu'il a encaissé, et la différence avec ce qu'il a déclaré.
- **Balance âgée** : les créances ouvertes rangées par ancienneté.
- **Plafond de crédit** : le montant de créances ouvertes au-delà duquel une nouvelle commande est refusée.
- **Dossier de recouvrement**, **Promesse** : partie 3.
- **Visite**, **Tournée** : une visite est un passage chez un point de vente ; une tournée est le plan de visites d'une journée.
- **Prospect**, **Ouverture**, **Passation** : un point de vente pas encore client, sa première commande, et son transfert au commercial du secteur.
- **Commande fournisseur**, **Réception**, **Litige**, **Inventaire** : partie 2.
- **Objectif** : un montant ou une quantité attendus sur une période, pour une zone, un agent de terrain ou un point de vente.
- **KPI de poste** : les 4 à 5 indicateurs pondérés d'un rôle, avec score sur 100.
- **Garde-fou** : un paramètre de l'organisation qui **bloque** une action (plafond de crédit, plancher de trésorerie, remise maximale, plafond de validation).
- **Alerte** : un fait signalé à un rôle. **Décision à trancher** : une demande qui attend un humain, avec un choix enregistré.
- **Règle d'automatisation** : partie 3.
- **Bouton « bientôt »** : un bouton visible mais inactif, avec la date prévue de sa mise en service.
- **Jeu de démonstration** : les données de test réalistes du §4.3.

---

## 4. Partie 1 — Les règles transverses

Ces exigences valent pour **tous** les modules des parties 2, 3 et 4.

### 4.1 Tout s'enregistre

**Ce que ça veut dire.** La démo affiche, calcule et simule. Le produit enregistre. Une action faite par un rôle est relue par les autres rôles, après rechargement, sur un autre appareil.

#### FR-1 : Chaque action est enregistrée côté serveur

Tout bouton d'action d'un écran crée ou modifie un objet enregistré côté serveur, dans l'organisation de l'utilisateur. Réalise UJ-1 à UJ-8.

**Conséquences (testables) :**
- Après l'action, recharger la page, se déconnecter, ou ouvrir l'écran depuis un autre appareil rend le même état.
- L'objet modifié est visible, dans la seconde qui suit, par les autres rôles dont le périmètre le couvre.
- Aucune donnée métier n'est conservée dans le stockage du navigateur ; seules des préférences d'affichage peuvent l'être.

#### FR-2 : Les boutons pas encore branchés sont « bientôt »

Un bouton dont la capacité n'est pas encore livrée s'affiche **« bientôt »** avec la date prévue, et ne fait rien d'autre qu'expliquer pourquoi. Aucun bouton ne simule un effet.

**Conséquences (testables) :**
- Un inventaire des boutons d'action, tenu avec le produit, donne pour chacun : écran, libellé, état (`BRANCHÉ` ou `BIENTÔT`), date prévue, exigence qui le branche.
- Un test parcourt chaque écran et échoue si un bouton n'est ni branché ni marqué « bientôt ».
- Un bouton « bientôt » passé sa date est signalé au PO, pas masqué.
- En essai prospect, un bouton « bientôt » affiche « Disponible en <mois> ».

#### FR-3 : Les enchaînements entre rôles sont des étapes enregistrées

Un travail qui passe d'un rôle à l'autre (une remise soumise au DG, un combo transmis au marketing, une commande fournisseur au-delà d'un plafond, une passation) avance par étapes **enregistrées**, chacune avec son auteur, sa date et son motif. C'est le patron du circuit « combos stock », le seul qui va au bout dans la démo, généralisé.

**Conséquences (testables) :**
- Chaque étape apparaît dans la file du rôle suivant, avec son badge de comptage, et disparaît de la file une fois traitée.
- Une étape refusée revient à son auteur avec le motif.
- L'historique d'un enchaînement est consultable de bout en bout.

### 4.2 Rôles et périmètres

#### FR-4 : Quinze rôles, dont l'administrateur

L'organisation dispose des 14 rôles du §2.1 et de `DIST_ADMIN`. L'administrateur crée les utilisateurs, leur attribue un rôle et un périmètre (zone, région, portefeuille, entrepôt), et règle les garde-fous et les objectifs.

**Conséquences (testables) :**
- Un utilisateur sans rôle ne voit aucun écran métier.
- Changer le rôle ou le périmètre d'un utilisateur prend effet à sa requête suivante.
- Les rôles s'attribuent par les droits de tenant du contrat de module (C7), sans déploiement.

#### FR-5 : Une seule table d'accès, appliquée par le serveur

Ce qu'un rôle peut ouvrir est décrit une seule fois. Le menu en est une projection, et **le serveur l'applique** sur chaque route d'API, pas seulement l'écran.

**Conséquences (testables) :**
- Une adresse d'écran saisie à la main par un rôle qui n'y a pas droit rend « accès refusé », jamais l'écran.
- Un appel d'API direct hors droits rend un refus nommé, sans aucune donnée dans le corps.
- La table de la démo (`route-access.ts`) est le point de départ ; les fiches personas et la spec V2, périmées, ne font pas foi.

#### FR-6 : Chacun voit son périmètre, appliqué par le serveur

Les données sont filtrées côté serveur selon le périmètre : le commercial, le freelance et le chargé de prospection ne voient que **leur** portefeuille ; le superviseur et le responsable des ventes, leur zone ou leur région ; le gestionnaire d'entrepôt, son entrepôt.

**Conséquences (testables) :**
- Un commercial qui saisit l'adresse de la fiche d'un point de vente hors de son portefeuille obtient « introuvable », comme pour un point de vente inexistant.
- Le superviseur de Lomé Centre ne voit, sur `/commercial`, `/tournees` et `/equipe`, que les agents de sa zone.
- Le gestionnaire d'entrepôt de Kara ne voit ni ne modifie le stock de Lomé Port.
- Un filtre vide ne retombe jamais sur « toute l'organisation ».

#### FR-7 : Chaque rôle a sa vue, pas la vue du DG

Un écran partagé par plusieurs rôles rend la vue du rôle connecté. La mention « Vue DG », le classement de zone et les priorités du DG ne s'affichent qu'au DG et au DC.

**Conséquences (testables) :**
- La fiche d'un point de vente vue par un commercial montre sa dernière visite, ses relances en cours et son objectif du mois.
- Le marketing et le recouvrement ne voient pas la liste des points de vente sous l'étiquette « Vue DG ».

#### FR-8 : Les données privées restent privées

La marge du freelance n'est visible que du freelance. Les rémunérations et commissions d'un agent ne sont visibles que de lui-même et de la direction (DG, DC, DAF).

**Conséquences (testables) :**
- Aucun écran ni aucune réponse d'API ne rend la marge d'un freelance à un autre rôle que lui.
- Le superviseur et le contrôleur de gestion ne voient pas les rémunérations individuelles.

### 4.3 Le jeu de démonstration

**Ce que ça veut dire.** Un prospect doit pouvoir jouer UJ-1 et UJ-2 avec des données qui ressemblent à son métier. Le jeu est **fictif** et ne reprend aucun client réel. Il remplace les registres de la démo, dont les chiffres ne concordent pas (lignes différentes du montant de la facture, TVA calculée à 15 % du TTC, trois formats de numéro de facture, année 2026 figée).

#### FR-9 : Le Grossiste du Golfe

Prospera fournit un jeu de démonstration, **« Grossiste du Golfe »**, grossiste fictif de jus et boissons à Lomé.

**Conséquences (testables) :**
- Deux points de stock : un entrepôt à Lomé Port et un dépôt à Kara.
- Trois zones : Lomé Centre, Golfe Nord, Plateaux, de vraies communes du Togo.
- Douze agents de terrain, dont trois freelances et un chargé de prospection ; un compte par rôle du §2.1.
- Environ 600 points de vente, avec position GPS dans leur zone, plafond de crédit et conditions de règlement.
- Un catalogue de jus et boissons en bouteille, pack et carton, avec dates limites et lots pour les produits périssables `[ASSUMPTION: 60 à 80 articles, 5 familles : jus, nectars, sodas, eaux, boissons énergisantes]`.
- Trois mois d'historique : commandes, factures, encaissements (PI-SPI, FedaPay, espèces), relances, visites, réceptions fournisseurs.
- De vrais impayés : la balance âgée a des créances dans chaque tranche.

#### FR-10 : Trois tailles

Le jeu existe en trois tailles : **petit** (1 entrepôt, 4 agents, 120 points de vente), **moyen** (le §FR-9, par défaut), **grand** (4 points de stock, 40 agents, 2 000 points de vente). Les trois sont générés par la même règle.

**Conséquences (testables) :**
- Chaque taille se charge dans une organisation vierge en moins de 10 minutes `[ASSUMPTION]`.
- Le grand jeu sert aux mesures de performance du §8.

#### FR-11 : Un jeu cohérent au centime

Les chiffres du jeu se vérifient entre eux.

**Conséquences (testables) :**
- Pour chaque facture : somme des lignes HT + TVA à 18 % du HT = TTC, au franc près.
- Les numéros de facture suivent un seul format et une seule suite, sans trou ni doublon.
- Le stock d'un article = entrées − sorties depuis l'ouverture, pour chaque point de stock.
- La balance âgée = somme des créances ouvertes ; chaque créance = facture − encaissements − avoirs.
- Les dates sont relatives au jour du chargement (« il y a 45 jours »), jamais figées sur une année.
- Une suite de contrôles vérifie ces égalités à chaque chargement, et le chargement échoue si l'une est fausse.

#### FR-12 : Le jeu dans l'essai du prospect

En janvier, l'essai d'un prospect s'ouvre **avec** le jeu de sa verticale, et le prospect peut y ajouter ses données ; à partir de février, l'essai s'ouvre **vide** (décisions de la 18ᵉ séance). Le jeu peut être remis à son état initial.

**Conséquences (testables) :**
- Cinq essais simultanés ont chacun leur copie du jeu, sans fuite de l'un à l'autre.
- Les comptes du jeu n'ont aucun mot de passe écrit dans le code.

### 4.4 Les garde-fous

#### FR-13 : Des garde-fous paramétrables qui bloquent

Les seuils de la démo deviennent des **paramètres de l'organisation**, avec les valeurs de la démo par défaut. Un garde-fou **bloque** l'action ; il ne se contente pas de l'afficher.

| Garde-fou | Valeur par défaut (démo) | Ce qu'il bloque | Qui peut passer outre |
|---|---|---|---|
| Plafond de crédit d'un point de vente | par point de vente | la validation d'une commande | DAF (dérogation tracée) |
| Plafond de crédit à la 1re commande | 1,5 M | la 1re commande d'une ouverture | DC |
| Plancher de trésorerie | 40 M | une commande fournisseur ou un paiement qui le franchit | DAF, puis DG |
| Plafonds de validation d'un achat | 5 M (resp. stock), 20 M (DAF), DG au-delà | la validation d'une commande fournisseur | le niveau suivant |
| Seuil de remise soumise au DG | 12 % | une remise ou un combo au-delà | DG |
| Géofencing de clôture de visite | 200 m | la clôture hors rayon | superviseur (motif) |
| Distance maximale rentable d'une ouverture | 35 km | la création d'un prospect au-delà | DC |

**Conséquences (testables) :**
- Une action bloquée rend un refus nommé et lisible, avec le seuil et le moyen de le lever.
- Chaque dérogation est enregistrée : qui, quand, combien, pourquoi.
- Changer un seuil est réservé à `DIST_ADMIN` et au DG, et tracé.

### 4.5 Alertes et décisions

#### FR-14 : Un modèle unique d'alerte et de décision

Toutes les alertes et toutes les décisions à trancher des écrans (DG, DAF, recouvrement, marketing, stock, automatisations) suivent un seul modèle : objet concerné, rôle destinataire, gravité, échéance, statut, et pour une décision, les choix possibles.

**Conséquences (testables) :**
- Une décision passe de `À_TRANCHER` à `VALIDÉE`, `REFUSÉE` ou `REPORTÉE` (avec nouvelle échéance), enregistrée avec son auteur.
- Un journal des décisions, consultable par la direction, dit qui a décidé quoi et quand, et si c'est réversible.
- Le badge « à valider » du menu compte les décisions réellement en attente.

### 4.6 Des chiffres vrais

#### FR-15 : Tout indicateur se calcule depuis les données

Un chiffre affiché (KPI de poste, 8 chiffres du DG, score, taux, projection, écart de caisse) est **calculé depuis les objets enregistrés**, avec sa période et sa date de calcul. Aucun chiffre affiché n'est une constante.

**Conséquences (testables) :**
- Saisir une commande change, après recalcul, le CA du jour du commercial, de sa zone et du DG.
- Chaque indicateur indique sa période (« juin 2026 », « 7 derniers jours ») et l'heure de son dernier calcul.
- Un indicateur dont la donnée manque s'affiche « non disponible », jamais 0.

#### FR-16 : Une prédiction dit d'où elle vient

Toute prédiction ou tout score affiché (score de santé d'un point de vente, probabilité d'acceptation d'une proforma, probabilité de recouvrement, quantité de réappro) porte sa **provenance** : règle ou modèle, version, date (contrat, C11). Une règle déterministe s'appelle « règle », pas « IA ».

**Conséquences (testables) :**
- Survoler un score montre sa règle ou son modèle, sa version et sa date.
- Une prédiction sans provenance ne s'affiche pas.

### 4.7 Documents et exports

#### FR-17 : De vrais documents

La facture, l'avoir, la proforma et le bon de livraison produisent un **PDF** réel, téléchargeable, imprimable et envoyable (par `notification`). « Imprimer » n'est pas l'impression de la page web.

**Conséquences (testables) :**
- Le PDF reprend exactement les montants et le numéro enregistrés.
- Un document déjà émis se régénère à l'identique.

#### FR-18 : Exporter ses listes

Toute liste d'un écran s'exporte en CSV et Excel, dans le périmètre de l'utilisateur. L'export de toutes les données de l'organisation reste le droit `instance:donnees:exporter` (contrat, C2).

**Hors périmètre :** l'export au format d'import de Sage (après, décision du PO).

### 4.8 Modules installables

#### FR-19 : Chaque module est installable seul

Chaque module des parties 2 et 3 est un module du catalogue, avec son manifeste (annexe A). Un module non installé n'apparaît pas au menu, et l'écran qui en attendait une donnée affiche « non installé », jamais 0 (contrat, C4).

**Conséquences (testables) :**
- Installer le pack distributeur sur une organisation vierge fait apparaître ses modules dans la coque en une action.
- Désinstaller un module ne supprime rien ; le réinstaller retrouve les données.
- Le menu suit l'état publié de chaque module (contrat, C8).

`FR-20` à `FR-29` : réservés.

---

## 5. Partie 2 — Les modules propres au distributeur

Cette partie décrit sept modules qui n'existent que pour un distributeur ou un grossiste : Commande, Facturation, Approvisionnement, Opérations entrepôt, Conquête et objectifs, Studio réseaux sociaux, Réseau Freelance. Le front de démo `prospera-distributeur` les définit. Le PRD exige tout ce que la démo présente, mais en vrai : chaque action est enregistrée côté serveur et relue par les autres rôles. Aujourd'hui rien n'est enregistré.

Deux modules sont ★ : le client de février en a besoin (Commande, Facturation). Les cinq autres sont écrits en entier, mais leur livraison suit les deux premiers.

Règles communes à tous les modules de cette partie :
- **Bouton « bientôt ».** Un bouton dont la capacité n'est pas branchée est visible, désactivé, et porte « bientôt » suivi d'une date. Jamais un bouton qui simule. Les dates ci-dessous sont des propositions. [ASSUMPTION: calendrier du plan v3 : démo le 15/01/2027, client de février en février 2027 ; toute date « bientôt » est à confirmer par le PO.]
- **Emplacement déclaré vide.** Si un module dont on dépend n'est pas installé, la donnée s'affiche « non installé », jamais 0. Exemple : marge d'une commande quand le coût d'achat n'est pas disponible ; solde de trésorerie quand aucun module financier n'est installé.
- **Jeu de démonstration.** Les exemples chiffrés viennent du grossiste fictif « Grossiste du Golfe » : Lomé Port et dépôt Kara, zones Lomé Centre, Golfe Nord et Plateaux, 12 commerciaux dont 3 freelances, environ 600 points de vente, jus et boissons, XOF, TVA 18 %.
- **Moyens de paiement.** Tout encaissement passe par le module `paiement` (renvoi, partie 4) : PI-SPI et FedaPay, plus espèces et virement déclarés. Aucune exigence de cette partie ne se limite à PI-SPI.
- **Garde-fou.** Un paramètre par organisation qui BLOQUE une action, avec un code de refus nommé et un message lisible. Il n'est jamais seulement affiché.
- **Périmètre.** Un rôle ne lit que son périmètre, côté serveur. Une URL ou un appel direct hors périmètre est refusé.

---

### 5.1 Commande (`commande`, M08) ★

**Dans la démo.** Trois écrans selon le rôle sur `/commandes` (`CommandesView.tsx`) : pilotage (DG, DC, DAF, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT), prise de commande terrain (COMMERCIAL, PROSPECTION) et « Mes commandes grossiste » (FREELANCE). Le pilotage affiche 8 chiffres, un pipeline `BROUILLON → VALIDEE → PREPARATION → LIVREE`, un flux par entrepôt et une file prioritaire. Le catalogue (`CatalogueView.tsx`, onglet de `/stock`) est en lecture seule. La disponibilité (`DisponibiliteView.tsx`) donne `DISPONIBLE`, `LIMITE` ou `RUPTURE` sans la quantité.
- **MORT ou absent :** valider, passer en préparation, annuler ou modifier une commande ; bon de livraison (aucun type `BonLivraison`) ; vérification du stock à la validation (cette validation n'existe pas) ; ligne de commande typée (le champ `lignes` est un entier) ; réservation du stock.
- **SIMULÉ :** « Nouvelle commande terrain » ouvre un panier gardé dans le navigateur. « Transmettre la commande » écrit une `CommandeTerrain` locale (`terrain-workflow.ts`) sans vérifier le stock, sans calculer la marge, sans rien envoyer. Le nom du point de vente est un texte libre. Le canal WhatsApp n'est qu'une étiquette.
- **Deux modèles de commande** (`Commande` du registre, `CommandeTerrain` du navigateur) ne se parlent pas. Le PRD n'en garde qu'un.
- **Chiffres à ne pas reprendre :** taux de service forcé (`+12`, plancher 72, plafond 99), marge brute tirée au hasard entre 12,8 et 18,2 %, plancher grossiste cité mais non codé.

**Ce que le module fait.** Un chargé de bureau ou un commercial saisit une commande pour un point de vente. Le serveur fige le prix de chaque ligne depuis la grille de prix, vérifie le stock, puis, à la validation, contrôle le plafond de crédit et RÉSERVE le stock. Un bon de livraison est produit pour l'entrepôt. La commande terrain, la commande WhatsApp saisie et la commande du bureau sont le même objet avec un canal différent. Le module réalise UJ-1 (de la commande à la facture juste) et UJ-2 (la commande prise en visite).

**Objets.**
- **Commande** : `numero` (`CMD-AAAA-NNNNNN`, continu par organisation), `point_de_vente` (référence au module `pdv`, jamais un texte), `commercial`, `canal` (`BUREAU | TERRAIN | WHATSAPP | TELEPHONE`), `point_de_stock_source`, `date_livraison_souhaitee`, `conditions_reglement`, `montant_ht`, `montant_tva`, `montant_ttc`, `statut`, `motif_annulation`, `visite` (optionnelle), `id_client_appareil` (clé d'idempotence), `facture` (lien, rempli à la facturation).
  - Statuts : `BROUILLON`, `TRANSMISE` (reçue du terrain ou de WhatsApp, pas encore validée), `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE`. [ASSUMPTION: `TRANSMISE` est ajouté aux 5 statuts de la démo ; le brouillon `BROUILLON` de la démo n'était jamais produit.]
- **Ligne de commande** : `article`, `quantite_commandee`, `unite`, `prix_unitaire_ht` (figé à la saisie), `origine_du_prix` (`GRILLE_SOCIETE | PRIX_NEGOCIE_CLIENT | GRILLE_FREELANCE`), `remise_pct`, `quantite_reservee`, `quantite_servie`, `quantite_facturee`, `taux_tva`, `cout_unitaire` (si disponible), `lot` (optionnel, voir module `stock`).
- **Bon de livraison** : `numero` (`BL-AAAA-NNNNNN`), `commande`, `point_de_stock`, `lignes` (article, quantité servie, lot), `statut` (`EN_PREPARATION | EXPEDIE | LIVRE | AVEC_ECART`), `date_expedition`, `date_livraison`, `chauffeur`, `preuve_de_livraison`.
- **Réservation** : vit dans le module `stock` (Stock réservé). `commande` la demande et la libère ; il ne la stocke pas.

#### FR-30 : Créer une commande au bureau

Un chargé de bureau, un responsable des ventes ou un commercial peut créer une commande pour un point de vente de son périmètre : client, lignes, canal, date de livraison souhaitée. Réalise UJ-1.

**Conséquences (testables) :**
- Le point de vente se choisit dans une liste de son périmètre. Un texte libre est refusé. Un point de vente hors périmètre est refusé : `PDV_HORS_PERIMETRE`.
- Le numéro `CMD-AAAA-NNNNNN` est attribué à l'enregistrement du brouillon. Il est unique et croissant dans l'organisation. Deux créations simultanées reçoivent deux numéros distincts.
- Une commande sans ligne ne peut pas quitter `BROUILLON` : `COMMANDE_SANS_LIGNE`.
- Une commande `BROUILLON` ne réserve aucun stock.
- Une commande créée par un commercial apparaît dans la liste de son superviseur et du bureau dans la minute, sans rechargement manuel. [ASSUMPTION: « dans la minute » sert de critère de test.]

#### FR-31 : Ligne de commande typée et prix figé

Chaque ligne porte un article, une quantité, une unité et un prix unitaire HT lu dans la grille de prix du module `catalogue`. Le prix est figé sur la ligne à la saisie. Réalise UJ-1.

**Conséquences (testables) :**
- Ordre de recherche du prix : prix négocié du client, puis prix société. Un commercial freelance utilise la grille du freelance (FR-93). L'origine du prix est enregistrée sur la ligne.
- Un article sans prix applicable est refusé : `ARTICLE_SANS_PRIX`.
- Un changement de grille après la saisie ne modifie pas une commande existante.
- Les totaux suivent FR-45 : `Σ lignes = HT`, `TVA = 18 %`, `TTC = HT + TVA`, arrondis à l'unité XOF.
- Exemple de test : 10 caisses de jus d'orange 1 L à 6 000 XOF HT = 60 000 HT, 10 800 de TVA, 70 800 TTC.
- Une remise de ligne au-dessus du seuil de remise de l'organisation (paramètre) passe en validation d'un rôle supérieur : `REMISE_AU_DESSUS_DU_SEUIL`. [ASSUMPTION: le seuil de la démo pour les combos est 12 % ; il est repris comme valeur par défaut de ce garde-fou.]

**Hors périmètre :** les paliers de volume et les promotions automatiques (ils vivent dans la grille du module `catalogue`).

#### FR-32 : Vérifier le stock avant validation

À la saisie de chaque ligne, le module interroge le module `stock` et affiche la disponibilité. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Pour le chargé de bureau et le responsable stock : la quantité disponible (stock moins Stock réservé) du Point de stock source est affichée.
- Pour un commercial ou un freelance : seul le statut est affiché, sans quantité. `RUPTURE` si le disponible est 0 ou moins. `LIMITE` si le disponible est sous le seuil de l'article. `DISPONIBLE` sinon.
- Le statut se calcule sur le Point de stock source du client, pas sur la somme des entrepôts. (La démo consolidait tout le réseau.)
- Un article `RUPTURE` ne peut pas être ajouté à une commande terrain. Au bureau, la saisie reste possible mais la validation est refusée (FR-33).
- Si le module `stock` n'est pas installé, la disponibilité affiche « non installé » et la validation est refusée : `STOCK_NON_INSTALLE`. La commande ne se valide jamais sur un stock inconnu.

#### FR-33 : Valider une commande avec contrôles

Un chargé de bureau, un superviseur ou un responsable des ventes peut valider une commande `BROUILLON` ou `TRANSMISE`. Le serveur applique trois contrôles avant de passer à `VALIDEE`. Réalise UJ-1.

**Conséquences (testables) :**
- **Stock.** Chaque ligne doit avoir un disponible suffisant. Sinon `STOCK_INSUFFISANT`, avec la ligne et la quantité disponible. Le validateur peut réduire la ligne ou accepter une livraison partielle (FR-41).
- **Plafond de crédit.** Si `encours du client + TTC de la commande` dépasse le plafond de crédit du client (module `pdv`), la validation est refusée : `PLAFOND_CREDIT_DEPASSE`. Le plafond par défaut, quand le client n'en a pas, est `max(400 000 XOF, 0,6 × CA mensuel du client)`. [ASSUMPTION: règle de la démo, `picking-engine.ts:36-45`, reprise comme valeur par défaut paramétrable.]
- **Créance échue.** Si le client a une créance échue depuis 45 jours ou plus (paramètre), la validation est refusée : `CREANCE_ECHUE_BLOQUANTE`.
- Un DAF ou un DG peut lever un refus de plafond ou de créance par une dérogation avec motif obligatoire. La dérogation est tracée (qui, quand, motif, montant). [ASSUMPTION: rôles autorisés à déroger = DG et DAF.]
- Un client dont le crédit est bloqué par le recouvrement (module partagé, partie 3) est refusé : `CREDIT_BLOQUE`. Cette règle est nouvelle : dans la démo, le blocage de crédit ne changeait rien.
- Un commercial ne peut pas valider sa propre commande. Il la transmet.
- La validation est atomique : si un contrôle échoue, aucune réservation n'est posée.
- Un rôle sans le droit de valider ne voit pas le bouton. Un appel direct est refusé : `ROLE_NON_AUTORISE`.

#### FR-34 : Réserver le stock à la validation

À la validation, le module demande au module `stock` de réserver chaque ligne sur le Point de stock source. Réalise UJ-1.

**Conséquences (testables) :**
- Après validation, `disponible = stock − Stock réservé` baisse de la quantité réservée, pour tous les rôles qui lisent le stock.
- Une réservation est posée pour la quantité servable de chaque ligne. Elle ne dépasse jamais le disponible.
- Deux validations simultanées sur le dernier stock : une réussit, l'autre reçoit `STOCK_INSUFFISANT`.
- L'annulation d'une commande `VALIDEE` ou `PREPARATION` libère la réservation immédiatement.
- La livraison transforme la réservation en sortie de stock (un mouvement dans le module `stock`).
- Une commande `VALIDEE` non préparée au bout de N jours est signalée au bureau ; la réservation n'expire pas toute seule. [ASSUMPTION: N = 7 jours, paramètre. Décision à trancher : expiration automatique ou non.]

**Hors périmètre :** la réservation des lots promotionnels (combos stock, marketing).

#### FR-35 : Modifier ou annuler une commande

Le propriétaire de la commande ou le bureau peut modifier une commande `BROUILLON`, `TRANSMISE` ou `VALIDEE` non commencée. Seul le bureau peut l'annuler.

**Conséquences (testables) :**
- Une commande `PREPARATION` ou au-delà n'est pas modifiable : `COMMANDE_NON_MODIFIABLE`. Elle peut être annulée par un responsable stock avec motif, ce qui libère les quantités non encore sorties.
- Modifier une commande `VALIDEE` annule la réservation, applique de nouveau FR-33, puis réserve de nouveau. Si un contrôle échoue, la commande garde son état précédent.
- L'annulation exige un motif parmi une liste (client annule, erreur de saisie, rupture, plafond de crédit, autre avec texte). Le motif est enregistré avec l'auteur et l'horodatage.
- Une commande facturée ne s'annule pas : on émet un avoir (FR-48).
- Toute modification est dans un historique en lecture seule : champ, ancienne valeur, nouvelle valeur, auteur, date.

#### FR-36 : Produire le bon de livraison

À la validation, le module crée le bon de livraison que l'entrepôt prépare. Le bon est imprimable en PDF. Réalise UJ-1.

**Conséquences (testables) :**
- Un bon `BL-AAAA-NNNNNN` est créé pour chaque Point de stock source concerné. Une commande servie par deux points de stock a deux bons.
- Le bon liste les articles, les quantités à servir et les lots. Il ne montre ni prix, ni marge, ni plafond.
- Le bon passe à `EXPEDIE` quand le chargement est validé (FR-70), puis à `LIVRE` quand la livraison est confirmée (chauffeur ou commercial). La commande passe à `LIVREE` quand tous ses bons sont `LIVRE`.
- Les quantités réellement servies remplacent les quantités à servir. Un écart (servi inférieur à commandé) met le bon `AVEC_ECART` et ouvre un reliquat (FR-41).
- Le bon est le seul document qui déclenche la sortie de stock.
- Un PDF du bon se télécharge avec la mention « Bon de livraison » et la signature du destinataire. [ASSUMPTION: la preuve de livraison de février est une photo du bon signé ; la signature à l'écran est « bientôt ».]

#### FR-37 : Commande terrain (« Nouvelle commande terrain »)

Un commercial, un freelance ou un chargé de prospection peut créer une commande depuis la tournée, pour un client de son portefeuille. Réalise UJ-2.

**Conséquences (testables) :**
- « Nouvelle commande terrain » ouvre un formulaire : point de vente du portefeuille (liste), lignes choisies dans le catalogue avec la disponibilité de FR-32, canal.
- Le bouton « Transmettre » enregistre la commande côté serveur à l'état `TRANSMISE`. Elle apparaît dans la file du bureau. Le commercial la voit avec son statut, qui change quand le bureau la valide.
- La commande porte le lien vers la visite en cours si elle existe (module `visites`, partie 3). La clôture de visite affiche le montant réel de la commande, pas une saisie libre.
- Une transmission répétée avec le même `id_client_appareil` ne crée qu'une commande (idempotence). Ceci est indispensable pour l'application terrain hors connexion (partie 3, M12).
- Le contrôle de plafond de FR-33 s'affiche en avertissement dès la saisie ; le blocage a lieu à la validation du bureau.
- Un commercial ne voit ni la marge de la société, ni la priorité « BLOQUÉE IA » d'autres clients (écart de la démo : la carte de commande exposait la marge brute).

**Hors périmètre :** la saisie hors connexion et la synchronisation (partie 3, application `prospera-terrain`, M12). Ici : le contrat d'idempotence que l'application utilisera.

#### FR-38 : Commande WhatsApp

Un chargé de bureau ou un commercial peut enregistrer une commande reçue par WhatsApp en choisissant le canal `WHATSAPP`. Réalise UJ-1.

**Conséquences (testables) :**
- Le canal `WHATSAPP` est une valeur de la commande. La commande suit ensuite le même cycle que toute autre.
- Le message d'origine peut être collé dans un champ « message du client » et reste attaché à la commande.
- La réception automatique du message, son analyse et la proposition des lignes ne font pas partie de février. Le bouton « Créer depuis un message WhatsApp » est affiché désactivé avec « bientôt (après février 2027) ». [ASSUMPTION: dépend du connecteur WhatsApp du module `notification`.]
- L'envoi de la confirmation de commande au client par WhatsApp passe par le module `notification`. S'il n'est pas branché, le bouton affiche « bientôt » et la confirmation peut se télécharger en PDF.

#### FR-39 : Prix société, prix freelance et marge

Le module calcule la marge de chaque commande à partir des lignes. Réalise UJ-1.

**Conséquences (testables) :**
- `marge = Σ (prix_unitaire_ht − cout_unitaire) × quantité`, et `marge_pct = marge / montant_ht`. Le coût vient du module `stock` (coût d'achat moyen).
- Sans coût disponible pour au moins une ligne, la marge affiche « non calculable » avec la ligne en cause, jamais 0 et jamais un pourcentage par défaut.
- La marge est visible des rôles qui ont le droit « voir la valeur commerciale » : DG, DC, DAF, CONTROLE_GESTION. Le responsable stock, le magasinier, le commercial et le freelance ne la voient pas. [ASSUMPTION: la démo se contredisait ; le responsable stock n'a pas ce droit dans `perimetre-logistique.ts`, on l'applique aussi au catalogue.]
- Pour une commande d'un freelance, la société ne voit que le prix société. Le prix que le freelance facture à son client n'est jamais stocké côté société (FR-94).
- La marge moyenne d'une période est pondérée par le montant HT, pas une moyenne simple.

#### FR-40 : Suivre les commandes (pilotage) avec des chiffres réels

Un DG, un DC, un responsable des ventes ou un superviseur voit le pipeline des commandes de son périmètre. Réalise UJ-1.

**Conséquences (testables) :**
- Les 8 chiffres de la démo (volume du jour, panier moyen, marge brute moyenne, en préparation, priorité, bloquées crédit, enseignes, lignes totales) sont calculés sur les commandes enregistrées. Aucune constante.
- Le pipeline compte les commandes par statut (`BROUILLON`, `TRANSMISE`, `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE`). Un clic sur un statut filtre la liste.
- Le taux de service = lignes servies / lignes commandées sur la période, sans ajustement. (La formule de la démo `+12` est supprimée.)
- Le périmètre est appliqué côté serveur : commercial et freelance = leurs commandes ; superviseur = sa zone ; responsable des ventes = ses zones ; magasinier = bons de préparation de son entrepôt, sans le carnet de commandes.
- Une zone sans commande affiche 0 commande. Un module non installé affiche « non installé ».

#### FR-41 : Livraison partielle et reliquat

Quand le servi est inférieur au commandé, le responsable stock ou le bureau décide du reliquat.

**Conséquences (testables) :**
- Le reliquat d'une ligne (commandé moins servi) est proposé : `LIVRER_PLUS_TARD` (nouveau bon quand le stock arrive) ou `ANNULER_LE_RELIQUAT`.
- `LIVRER_PLUS_TARD` garde la réservation ouverte sur les quantités à venir si elles sont attendues (commande fournisseur en cours) ; sinon le reliquat reste en attente sans réserver.
- La facture ne porte que les quantités servies (FR-42).
- Une commande dont tout le reliquat est annulé et dont tous les bons sont `LIVRE` passe à `LIVREE`.
- **Décision à trancher :** délai maximal d'un reliquat avant annulation automatique. [ASSUMPTION: 15 jours, paramètre.]

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Statut de disponibilité | `RUPTURE` si stock ≤ 0 ; `LIMITE` si stock < seuil ; sinon `DISPONIBLE` | seuil par article | `DisponibiliteView.tsx:25-29` |
| Blocage crédit | créance > 0 ET (retard ≥ 45 j OU créance > plafond) | 45 j : oui | `picking-engine.ts:36-45` |
| Plafond par défaut | `max(400 000, 0,6 × CA mensuel)` | oui | idem |
| TVA | 18 % | par article, voir FR-45 | `proforma-builder.ts:14` |
| Score de priorité d'une commande | base 50 ; +30 priorité haute ; −40 bloquée ; +15 client à risque ; +10 client fidèle ; −10 créance > 30 j ; +10 montant > 5 M ; +8 validée ; borné 0 à 100 | non en février | `picking-engine.ts:176-196` |
| Alerte « pic de préparation » | volume en préparation > 15 M XOF | oui | `commandes-dg-builder.ts:73` |
| Marge | `(prix − coût) / prix`, pondérée par le montant | non | nouvelle (la démo la tirait au hasard) |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Tuile du pipeline, filtre de zone, « Tout afficher » | LECTURE (filtre local) | FR-40 |
| Nouvelle commande terrain | SIMULÉ (panier local) | FR-37 |
| Panier : −, +, corbeille, Vider | SIMULÉ (navigateur) | FR-37 |
| Canal En visite / WhatsApp / Téléphone | SIMULÉ (étiquette) | FR-37 et FR-38 |
| Transmettre la commande | SIMULÉ (aucune vérification) | FR-37 |
| Ajouter (disponibilité) | SIMULÉ | FR-32 et FR-37 |
| Valider la commande | n'existe pas | FR-33 |
| Annuler, modifier | n'existent pas | FR-35 |
| Bon de livraison : générer, imprimer | n'existe pas | FR-36 |
| Créer depuis un message WhatsApp | n'existe pas | bientôt (après février 2027) |
| Signature du destinataire à l'écran | n'existe pas | bientôt (après février 2027) |

**Notes.**
- **Décision à trancher.** Où vivent les prix propres à chaque client (reprise de février) ? La grille du module `catalogue` ne connaît que zone, catégorie de client et seuil de volume. Option A : une grille dont la condition est « ce client » (amendement du PRD `catalogue`). Option B : une catégorie de client à un seul membre. [ASSUMPTION: option A, car B multiplie les catégories pour un client de plusieurs centaines de prix négociés.] Ce module consomme le prix, il ne le stocke pas.
- **Décision à trancher.** Facturer à la validation ou à la livraison ? [ASSUMPTION: par défaut à la livraison, sur les quantités servies (FR-42), paramétrable.]
- **Question ouverte.** Un casier ou une consigne de bouteille rendu(e) n'est ni un avoir ni un paiement. [ASSUMPTION: les consignes sont hors v1.]
- **Question ouverte.** Un client peut-il avoir plusieurs adresses de livraison ? La démo n'a qu'une adresse par point de vente. [ASSUMPTION: une adresse, celle du point de vente.]
- Aucune commande ne se crée sans Organisation, Rôle et Périmètre résolus par le socle ; la commande lit ses acteurs dans `reseau` et ses clients dans `pdv`.

---

### 5.2 Facturation, proformas et e-facture (`facturation`, M09) ★

**Dans la démo.** `/facturation` a trois onglets (`FacturationShell.tsx`) : Factures et créances (8 chiffres, top clients impayés, grille tarifaire par type de client, fiche facture), Proformas (6 chiffres, builder, score d'acceptation), E-facturation et avoirs (file de transmission, rejets, 3 avoirs).
- **Aucune action d'écriture sur une facture** dans l'onglet des factures : ni envoyer, ni imprimer, ni encaisser, ni créer un avoir.
- **SIMULÉ :** « Convertir en commande » fabrique deux références (`CMD-` et `FAC-`) sans rien créer ; « Relancer » une proforma incrémente un compteur ; « Envoyer au client » écrit une proforma locale ; « Imprimer / PDF » appelle `window.print()` ; « Corriger et retransmettre » ne corrige rien.
- **Statut e-facture DÉRIVÉ** de l'ancienneté de l'impayé (`efacture-builder.ts:41-48`), pas reçu d'une plateforme. Le hash et le QR sont factices.
- **Numérotation :** `FAC-2026-NNNN` avec l'année figée à 2026 ; compteur local, ni global ni transactionnel.
- **Données incohérentes :** les lignes d'une facture ne rejoignent pas son montant (`FAC-2026-8821` : lignes 3 450 000, montant 2 840 000) ; HT, TVA et TTC sont déclarés mais non renseignés ; marge 15 % par défaut ; NIF et RCCM de l'émetteur écrits en dur dans le composant (`DocumentPreview.tsx:284`).
- **Mentions absentes du modèle :** NIF, RCCM et adresse du client ; adresse du siège, capital, régime fiscal, coordonnées de paiement de l'émetteur ; pénalités de retard ; numéro de commande et de BL ; signature et cachet.
- **Rôles :** onglet factures pour DG, DC, DAF, COMPTABLE, RECOUVREMENT ; proformas pour la force de vente ; e-facture pour DG, DAF, COMPTABLE. CONTROLE_GESTION a la route mais aucun onglet (écran vide).

**Ce que le module fait.** Il émet les factures, les avoirs et les proformas. Une facture se crée depuis une commande en un clic. Elle reçoit un numéro continu qui reprend la suite de Sage. Elle porte toutes les mentions légales et la TVA à 18 %. Elle s'imprime, se télécharge en PDF et s'envoie. Elle ouvre une Créance, que les Encaissements du module `paiement` réduisent (renvoi : partie 4 ; la Créance est un objet commun décrit en partie 3). Le module donne la balance clients et la balance âgée. Il porte aussi la reprise des factures impayées à la bascule. L'e-facture (certification OTR) est visible mais « bientôt » tant que la plateforme n'est pas branchée. Le module réalise UJ-1.

**Objets.**
- **Facture** : `numero`, `serie`, `client` (point de vente), `commande`, `bons_de_livraison`, `date_emission`, `date_echeance`, `conditions_reglement`, `lignes`, `montant_ht`, `montant_tva`, `montant_ttc`, `montant_avoirs`, `montant_encaisse`, `reste_du`, `statut`, `origine` (`EMISE_PROSPERA | REPRISE`), `pdf` (fichier figé), `envois`.
  - Statuts : `BROUILLON`, `EMISE`, `PARTIELLE`, `PAYEE`, `ANNULEE_PAR_AVOIR`. `EN_RETARD` n'est pas un statut : c'est un calcul (échéance dépassée et reste dû supérieur à 0).
- **Ligne de facture** : `article`, `designation`, `quantite`, `unite`, `prix_unitaire_ht`, `remise_pct`, `taux_tva`, `total_ht`, `commande_ligne`.
- **Avoir** : `numero` (`AV-AAAA-NNNNNN`), `facture`, `motif`, `lignes`, `montant_ht`, `montant_ttc`, `date`, `statut` (`EMIS | IMPUTE | REMBOURSE`).
- **Proforma** : `numero` (`PRO-AAAA-NNNNNN`), `client`, `commercial`, `date_emission`, `date_validite`, `lignes`, `remise_globale_pct`, `montant_ht`, `montant_tva`, `montant_ttc`, `conditions_reglement`, `statut` (`BROUILLON | ENVOYEE | VUE | ACCEPTEE | REFUSEE | EXPIREE | CONVERTIE`), `probabilite_acceptation` (0-100), `canal_envoi` (`WHATSAPP | EMAIL | SMS | IMPRESSION`), `relances_envoyees`, `commande`.
- **Suite de numérotation** : `serie`, `format`, `dernier_numero_attribue`, `dernier_numero_repris` (Sage), `date_reprise`.
- **E-facture** : `facture`, `statut` (`NON_TRANSMISE | EN_ATTENTE | TRANSMISE | CERTIFIEE | REJETEE`), `numero_certification`, `date_transmission`, `motif_rejet`, `tentatives`, `plateforme`, `archive`.
- **Créance** : objet commun de la partie 3. Une facture émise en ouvre une ; un avoir ou un Encaissement la réduit.

#### FR-42 : Créer la facture depuis la commande, en un clic

Un chargé de facturation ou un DAF peut créer et émettre la facture d'une commande en un clic. Réalise UJ-1.

**Conséquences (testables) :**
- Le bouton « Facturer » est actif sur une commande `LIVREE` ou sur un bon `LIVRE` non encore facturé. [ASSUMPTION: facturation à la livraison par défaut ; une option par organisation permet de facturer dès `VALIDEE`.]
- Les lignes de la facture reprennent les quantités servies, les prix figés de la commande et la TVA de chaque article. L'utilisateur ne retape rien.
- Un deuxième clic sur la même commande ne crée pas de deuxième facture : il ouvre la première (idempotence).
- Une facture peut couvrir une livraison partielle. Le reliquat livré plus tard donne une seconde facture. Le lien commande ↔ factures est visible dans les deux sens.
- La facture est créée `BROUILLON`, puis émise (FR-43) dans la même action si toutes les mentions légales sont complètes (FR-44).
- Si le module `commande` n'est pas installé, le bouton n'existe pas et la facture se saisit à la main (lignes libres). [ASSUMPTION: la saisie manuelle sert à la reprise et aux ventes comptoir.]

#### FR-43 : Numérotation continue qui reprend la suite de Sage

Le DAF peut déclarer à la bascule le dernier numéro de facture émis sous Sage. La première facture Prospera porte le numéro suivant. Réalise UJ-1.

**Conséquences (testables) :**
- Avant la déclaration, l'émission d'une facture est refusée : `NUMEROTATION_NON_INITIALISEE`.
- Le format est un paramètre de l'organisation : préfixe, année optionnelle, largeur du numéro. [ASSUMPTION: le format exact de Sage est inconnu ; il est saisi à la bascule d'après la dernière facture Sage. Exemple de test : dernier numéro Sage `FAC-2026-0412`, première facture Prospera `FAC-2026-0413`.]
- Le numéro est attribué à l'émission, pas au brouillon. Un brouillon abandonné ne crée aucun trou.
- Aucun numéro n'est jamais réutilisé ni sauté. Test : 50 émissions simultanées donnent 50 numéros consécutifs, sans doublon.
- Une facture émise ne se supprime pas et ne se modifie plus. Une erreur se corrige par un avoir (FR-48).
- Les avoirs ont leur propre suite continue. Les proformas aussi (sans valeur fiscale).
- Une facture reprise de Sage (FR-58) garde son numéro d'origine et n'avance pas la suite.
- **Décision à trancher.** La suite repart-elle à 1 chaque année, ou est-elle continue sur plusieurs années ? [ASSUMPTION: continue, avec l'année dans le format. À valider par l'expert-comptable du client.]

#### FR-44 : Mentions légales sur chaque facture

L'émission d'une facture exige que toutes les mentions légales soient présentes. Réalise UJ-1.

**Conséquences (testables) :**
- Émetteur, lu de la fiche de l'Organisation (jamais en dur) : raison sociale, forme juridique, capital, adresse du siège, NIF, RCCM, régime fiscal, coordonnées de paiement (RIB, compte Mobile Money).
- Client, lu de la fiche du point de vente : nom, adresse, NIF si le client est assujetti.
- Document : numéro, date d'émission, date d'échéance, références de commande et de bon de livraison, lignes (désignation, référence, quantité, prix unitaire HT, remise, total HT), total HT, TVA à 18 %, total TTC, conditions de règlement, pénalités de retard.
- Une mention manquante bloque l'émission : `MENTION_OBLIGATOIRE_MANQUANTE`, avec la liste des champs absents et le lien vers la fiche à compléter.
- Le texte de la facture indique « Facture » pour une facture, « Avoir » pour un avoir et « Proforma, ce document n'a pas valeur de facture » pour une proforma.
- [ASSUMPTION: la liste exacte des mentions obligatoires au Togo est à faire valider par l'expert-comptable du client avant le 20/11 ; la liste ci-dessus est celle de la démo complétée par les usages UEMOA.]

#### FR-45 : Montants exacts

Les montants d'une facture, d'un avoir et d'une proforma suivent une règle unique. Réalise UJ-1.

**Conséquences (testables) :**
- `Σ total_ht des lignes = montant_ht` (après remise globale). `montant_tva = arrondi(montant_ht × 18 %)`. `montant_ttc = montant_ht + montant_tva`. Arrondi à l'unité XOF. Ces égalités sont vérifiées à l'émission ; un écart refuse l'émission : `TOTAUX_INCOHERENTS`.
- Le taux de TVA est porté par l'article (module `catalogue`), 18 % par défaut. Plusieurs taux sur une facture donnent une TVA par taux, arrondie par taux.
- Une remise de ligne se déduit du prix avant calcul de la TVA. La TVA se calcule sur le HT remisé. (La démo avait un cas à 17,4 %.)
- La devise est XOF et se déclare sur le document.
- Exemple de test (Grossiste du Golfe) : 40 caisses de jus de mangue à 7 500 HT + 25 caisses de boisson gazeuse à 5 200 HT = 300 000 + 130 000 = 430 000 HT, TVA 77 400, TTC 507 400.
- **Hors périmètre :** TVA multi-pays, exonérations partielles, taxes spécifiques (accises). [ASSUMPTION: taux unique à 18 % en février ; la démo ne gère ni multi-taux ni exonération.]

#### FR-46 : Imprimer et télécharger la facture en PDF

Tout rôle qui voit une facture peut l'imprimer et la télécharger en PDF. Réalise UJ-1.

**Conséquences (testables) :**
- Un PDF est généré par le serveur à l'émission et conservé. Le même fichier se retélécharge à l'identique des années plus tard.
- Le PDF reproduit les mentions de FR-44. Il tient sur des pages A4, avec le numéro de page et le numéro de facture en pied.
- Le bouton « Imprimer / PDF » ne dépend pas de l'impression du navigateur.
- Un brouillon se télécharge avec le filigrane « BROUILLON — sans valeur ». Une proforma avec la mention de FR-44.
- Un rôle hors périmètre reçoit un refus, y compris par l'adresse directe du fichier : `FACTURE_HORS_PERIMETRE`.
- Les factures sont conservées au moins 10 ans (durée de la démo, `types/index.ts:199`). [ASSUMPTION: 10 ans.]

#### FR-47 : Envoyer la facture au client

Un chargé de facturation peut envoyer la facture par e-mail, et par WhatsApp ou SMS quand ces canaux sont branchés. Réalise UJ-1.

**Conséquences (testables) :**
- L'envoi passe par le module `notification`. Le statut d'envoi (`ENVOYE`, `ECHEC`, avec la raison) est enregistré sur la facture avec la date et l'auteur.
- Le PDF de FR-46 est joint (e-mail) ou accessible par un lien à durée limitée (WhatsApp, SMS).
- Un canal non branché affiche son bouton désactivé : « Envoyer par WhatsApp : bientôt (février 2027) ». [ASSUMPTION: e-mail disponible en février ; WhatsApp et SMS dépendent de `notification`.]
- Un envoi échoué ne passe jamais pour réussi. L'utilisateur voit l'échec et peut réessayer.
- Si `notification` n'est pas installé, tous les boutons d'envoi affichent « non installé » et le téléchargement reste disponible.
- Le client sans adresse e-mail ni numéro est signalé avant l'envoi.

#### FR-48 : Émettre un avoir

Un chargé de facturation, avec validation d'un DAF au-dessus d'un seuil, peut émettre un avoir sur une facture émise. Réalise UJ-1.

**Conséquences (testables) :**
- L'avoir est total ou partiel. Il se compose de lignes de la facture (quantité et prix) ou d'un montant libre avec motif.
- Le motif est obligatoire : retour de marchandise, erreur de prix, remise commerciale, litige de livraison, erreur de facturation.
- Un avoir qui dépasse le reste à créditer de la facture est refusé : `AVOIR_SUPERIEUR_A_LA_FACTURE`.
- L'avoir reçoit un numéro `AV-AAAA-NNNNNN` continu (FR-43) et un PDF avec la mention « Avoir » et la référence de la facture.
- L'avoir réduit la Créance. Si le client a déjà tout payé, le crédit reste au solde du client (`IMPUTE` sur une facture suivante ou `REMBOURSE`).
- Un avoir pour retour de marchandise propose une entrée de stock dans le module `stock`, à confirmer par le magasinier. [ASSUMPTION: l'avoir n'entre jamais le stock tout seul.]
- Un avoir au-dessus de 500 000 XOF exige la validation du DAF. [ASSUMPTION: seuil paramétrable, 500 000 XOF par défaut.]
- Un avoir émis ne se supprime pas.

#### FR-49 : Facture, Créance et paiements partiels

Chaque facture émise ouvre une Créance. Les Encaissements du module `paiement` la réduisent, en une ou plusieurs fois. Réalise UJ-1.

**Conséquences (testables) :**
- `reste_du = montant_ttc − montant_avoirs − montant_encaisse`. Un paiement partiel passe la facture à `PARTIELLE` ; quand `reste_du` atteint 0, elle passe à `PAYEE`.
- Les moyens de paiement acceptés sont ceux de l'organisation : PI-SPI, FedaPay, espèces, virement. Le module `facturation` ne les implémente pas ; il lit les Encaissements du module `paiement`.
- Exemple de test (UJ-1) : facture de 507 400 XOF ; paiement de 200 000 par FedaPay, reste dû 307 400, statut `PARTIELLE` ; paiement de 307 400 par PI-SPI, statut `PAYEE`.
- Un paiement supérieur au reste dû est refusé : `PAIEMENT_SUPERIEUR_AU_RESTE_DU`. [ASSUMPTION: l'excédent n'est pas géré en février.]
- La facture affiche la liste de ses Encaissements : date, moyen, montant, référence. (La démo ne gardait qu'un total.)
- Si le module `paiement` n'est pas installé, le champ « encaissé » affiche « non installé » et aucun reste dû n'est calculé.
- Le statut passe à `EN_RETARD` à l'affichage le lendemain de l'échéance, sans traitement manuel.

#### FR-50 : Balance clients

Un DG, un DAF, un comptable, un responsable du recouvrement ou un commercial (pour son portefeuille) peut lire la balance clients à une date. Réalise UJ-1.

**Conséquences (testables) :**
- Une ligne par client : total facturé, avoirs, encaissé, reste dû, nombre de factures ouvertes, plus ancienne échéance dépassée, plafond de crédit, encours.
- Le total de la balance égale la somme des restes dus de toutes les factures ouvertes et des factures reprises (FR-58). Cette égalité est vérifiée par un contrôle visible. Un écart s'affiche en rouge avec le client en cause.
- On peut choisir une date passée (« au 31/01 ») : la balance se recalcule sur les pièces et Encaissements datés avant.
- Le périmètre limite les lignes : un commercial ne voit que ses clients (côté serveur).
- La balance s'exporte en CSV et en PDF.
- Un client dépassant son plafond est marqué « plafond dépassé ».

#### FR-51 : Balance âgée

Les mêmes rôles peuvent lire la balance âgée des Créances. Réalise UJ-1.

**Conséquences (testables) :**
- Tranches par défaut, paramétrables : non échu, 1 à 30 jours, 31 à 60 jours, 61 à 90 jours, plus de 90 jours. [ASSUMPTION: 5 tranches, comme la version « comptable » de la démo ; la version des relances n'en avait que 4. Décision à trancher.]
- L'âge se calcule depuis l'échéance, pas depuis l'émission.
- Vues : par client, par commercial, par zone, par moyen de règlement attendu. Une tranche vide s'affiche à 0.
- Le total de la balance âgée égale le total de la balance clients de la même date (FR-50). Test automatique.
- Les factures reprises de Sage (FR-58) y figurent avec leur échéance d'origine.
- Un clic sur une tranche ouvre la liste des factures. La balance alimente le rapport du DG et les dossiers de relance (partie 3).
- Il n'y a pas de balance âgée fournisseur dans cette exigence : elle appartient à l'Approvisionnement (FR-67).

#### FR-52 : Encours, plafond de crédit et conditions de règlement par client

Le module lit le plafond de crédit et les conditions de règlement du client dans le module `pdv` et les applique. Réalise UJ-1.

**Conséquences (testables) :**
- `encours = Σ reste dû des factures du client (émises et reprises)`. Il est recalculé à chaque encaissement ou avoir.
- L'échéance d'une facture = date d'émission + délai de règlement du client (30, 45 ou 60 jours, ou comptant). Sans délai sur la fiche du client, l'émission est refusée : `CONDITIONS_REGLEMENT_MANQUANTES`.
- Un plafond est porté par le client, pas par la facture. (La démo recopiait le plafond de la première facture.)
- Un client dont l'encours dépasse le plafond affiche « plafond dépassé » dans la balance, la fiche client et la commande (FR-33).
- Les valeurs par défaut par type de client (remise de base, délai, plafond) de la démo sont des valeurs d'amorçage à saisir à la reprise : dépôt ou grossiste volume : remise 8 %, 60 j, plafond 5 à 15 M ; grossiste : 5 %, 30 j, 3 à 10 M ; supérette : 3 %, 30 j, 5 à 12 M ; épicerie ou kiosque : 0 %, 30 j, 1 à 4 M. [ASSUMPTION: ces plafonds sont du texte libre dans la démo ; ils ne sont repris que comme suggestions modifiables.]
- **Décision à trancher.** Le PRD `pdv` ne dit rien des conditions de règlement par client, alors que son manifeste les cite (écart relevé dans la reprise). Ce module les exige ; l'amendement du PRD `pdv` est à écrire.

#### FR-53 : Marge par facture

Un DG, un DC, un DAF ou un contrôleur de gestion voit la marge de chaque facture. Réalise UJ-1.

**Conséquences (testables) :**
- `marge_facture = Σ (prix_unitaire_ht − cout_unitaire) × quantité` ; `marge_pct = marge_facture / montant_ht`. Les coûts viennent du module `stock` au moment de la sortie.
- Un coût absent donne « non calculable », pas 15 %. (La démo posait 15 % par défaut.)
- Une facture reprise de Sage affiche « sans détail de lignes » : sa marge est « non calculable ».
- Le commercial et le magasinier ne voient pas la marge.
- Un avoir réduit la marge de la facture d'origine au prorata.

#### FR-54 : Proforma

Un commercial, un freelance ou un responsable des ventes peut créer et envoyer une proforma. Réalise UJ-2 pour la proforma préparée en visite.

**Conséquences (testables) :**
- La proforma prend les prix de la grille applicable au client (prix négocié, société ou freelance), pas un prix unique.
- Validité : 15 jours après l'émission (paramètre). Au 16e jour, la proforma passe seule à `EXPIREE`. (Le passage n'était pas codé dans la démo.)
- Elle a sa propre numérotation `PRO-AAAA-NNNNNN` et ne consomme aucun numéro de facture.
- Elle ne réserve pas de stock et n'ouvre pas de Créance.
- Statuts : `BROUILLON → ENVOYEE → VUE → ACCEPTEE | REFUSEE | EXPIREE → CONVERTIE`. `VUE` n'est posé que si le client ouvre le lien ; sans canal qui le sait, le statut reste `ENVOYEE`.
- Si l'encours du client après la proforma dépasse son plafond, un bandeau avertit et la conversion demandera la dérogation de FR-33.
- Pour un freelance : la marge minimale du freelance (12 % par défaut) avertit sans bloquer (FR-99).
- L'envoi suit FR-47.

#### FR-55 : Probabilité d'acceptation et relance d'une proforma

Le module affiche une probabilité d'acceptation et permet de relancer la proforma. Réalise UJ-2.

**Conséquences (testables) :**
- La probabilité (0 à 100) se calcule avec la formule de la démo (voir « Règles de calcul »). Elle est étiquetée « estimation ». ≥ 70 vert, ≥ 50 orange, sinon rouge.
- Chaque entrée de la formule vient de données réelles : score du client, créance, plafond, panier habituel, relances envoyées, vue ou non.
- Les proformas qui expirent sous 48 h sont comptées et listées.
- « Relancer » envoie réellement un message au client par le canal choisi (FR-47), incrémente `relances_envoyees` et journalise la date. Un canal non branché affiche « bientôt ».
- Le taux d'acceptation = `(ACCEPTEE + CONVERTIE) / (ACCEPTEE + CONVERTIE + REFUSEE + EXPIREE)`.
- Le délai moyen proforma → commande est la moyenne des durées réelles entre l'émission et la conversion. (La démo prenait la moitié de la validité.)

#### FR-56 : Convertir une proforma en commande

Un commercial ou un responsable des ventes peut convertir une proforma acceptée en commande. Réalise UJ-2.

**Conséquences (testables) :**
- Seule une proforma `ACCEPTEE` se convertit : `PROFORMA_NON_ACCEPTEE` sinon. (La démo laissait convertir un brouillon.)
- La conversion crée une Commande (FR-30) avec les lignes et les prix de la proforma, puis applique les contrôles de FR-33. Elle ne crée pas de facture. La facture suit la commande (FR-42).
- La proforma passe à `CONVERTIE` et garde le lien vers la commande. Une deuxième conversion renvoie la même commande.
- Une proforma `EXPIREE` ne se convertit pas : on en recrée une.
- Un client marqué `ACCEPTEE` hors du système (message WhatsApp, appel) : le commercial passe la proforma à `ACCEPTEE` à la main, avec date et auteur.

#### FR-57 : E-facture (statuts, contrôles, « bientôt »)

Le module porte le suivi de l'e-facture. En février la certification OTR n'est pas exigée et la plateforme n'est pas branchée. Réalise UJ-1 (partie fiscale, plus tard).

**Conséquences (testables) :**
- Tant que la plateforme OTR n'est pas branchée, toute facture est `NON_TRANSMISE`. L'onglet « E-facturation » affiche le bandeau « Plateforme OTR non branchée : bientôt (date à fixer avec le client) » et ne montre aucun chiffre de certification.
- Interdit : afficher `TRANSMISE`, `CERTIFIEE` ou `REJETEE` sans réponse réelle de la plateforme. Interdit : un numéro de certification, un hash ou un QR fabriqués. (La démo dérivait ces statuts de l'ancienneté de l'impayé.)
- Les boutons « Transmettre », « Corriger et retransmettre » et « Télécharger l'archive » sont désactivés avec « bientôt ».
- Contrôles préalables à la transmission, exécutables avant la plateforme : NIF du client présent, taux de TVA cohérent, code de nomenclature de chaque article présent. Chaque échec nomme la facture et la fiche à compléter : `NIF_CLIENT_ABSENT`, `TVA_INCOHERENTE`, `NOMENCLATURE_ABSENTE`. En février ils sont des avertissements, pas des blocages.
- Quand la plateforme sera branchée : statuts reçus (`EN_ATTENTE`, `TRANSMISE`, `CERTIFIEE`, `REJETEE`), motif de rejet, tentatives, archive légale conservée 10 ans.
- **Hors périmètre février :** la facture normalisée certifiée OTR et l'export vers Sage.

#### FR-58 : Reprendre les factures impayées à la bascule

Un administrateur de l'organisation peut charger les factures impayées de l'ancien système, pour que la balance clients soit juste dès le premier jour. Réalise UJ-1.

**Conséquences (testables) :**
- Objet de reprise `facturation.facture-ouverte` [ASSUMPTION: nom et version à fixer au manifeste, `facturation.facture-ouverte@1`] : numéro d'origine, client (référence reconnue dans `pdv`), date d'émission, date d'échéance, montant TTC, reste dû, devise.
- Une facture reprise garde son numéro d'origine tel quel. Elle n'avance pas la suite de numérotation (FR-43) et n'a pas de lignes (« sans détail »).
- Elle ouvre une Créance, apparaît dans la balance clients et la balance âgée, peut recevoir un Encaissement et un avoir, et porte `origine = REPRISE`.
- Contrôle de la reprise : `Σ reste dû chargé = total de la balance Sage fourni`, par client et en total. Un écart refuse la validation de la reprise : `ECART_DE_CONTROLE`.
- Un client absent de `pdv` rejette sa ligne avec le code `CLIENT_INCONNU` ; la ligne apparaît dans un rapport d'écarts ; elle ne crée pas de client en silence.
- Un numéro d'origine déjà présent est refusé : `NUMERO_DEJA_REPRIS`. Recharger le même fichier ne crée aucun doublon.
- Le PDF original reste dans Sage. Prospera n'en génère pas pour une facture reprise.
- Ce module n'a aucun manifeste aujourd'hui : l'objet de reprise est à produire au manifeste `facturation` (dû le 20/11). Sans lui, le chiffre de contrôle « reste dû » n'a pas de porteur.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| TVA | 18 % | par article | `proforma-builder.ts:14` |
| Totaux proforma | `HT = arrondi(brut × (1 − remise/100))` ; `TVA = arrondi(HT × 0,18)` ; `TTC = HT + TVA` | non | `proforma-builder.ts:24-29` |
| Ligne | `total = arrondi(prix × quantité × (1 − remise_ligne/100))` | non | `:31-41` |
| Validité d'une proforma | 15 jours | oui | `:16` |
| Proforma « expirante » | statut `ENVOYEE`, `VUE` ou `BROUILLON` et 0 à 2 jours restants | seuil : oui | `:112-116` |
| Probabilité d'acceptation | `score = score_client × 0,5` ; − `min(25, (créance/plafond) × 30)` ; + `min(20, remise × 3,5)` ; si panier/panier habituel > 1,5 : − `min(18, (ratio − 1,5) × 12)` ; si < 0,8 : + 6 ; + 8 si vue ; − 4 par relance ; résultat = `borné(0, 100, arrondi(score + 25))` | coefficients : non en février | `:47-80` |
| Plafond d'une proforma nouvelle | `max(1 M, ca_mois × 1,5)` ; panier habituel `max(200 000, ca_mois / 3)` | oui | `ProformaBuilder.tsx:56-70` |
| Reste à payer | `montant − avoirs − encaissé` | non | `facturation-dg-builder.ts:78` |
| Niveau de risque d'une facture | `CRITIQUE` si retard > 30 j OU score < 35 OU reste > plafond ; `ELEVE` si retard > 14 j OU score < 55 ; `MODERE` si retard > 0 ou partielle ; sinon `FAIBLE` | seuils : oui | `:67-74` |
| Taux de recouvrement | encaissé / facturé × 100 | non | `:115` |
| Délai moyen d'encaissement | moyenne (dernier paiement − émission) des factures `PAYEE` ; « non calculable » sans facture payée (la démo mettait 25 ou 28 j) | non | `:95-114` |
| Numérotation | suite continue, voir FR-43 | format : oui | nouvelle |
| E-facture | statuts reçus de la plateforme uniquement | non | nouvelle |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Vues et filtres de factures | LECTURE | FR-50 et FR-51 |
| (absent) Facturer depuis la commande | n'existe pas | FR-42 |
| (absent) Enregistrer un paiement sur une facture | n'existe pas | FR-49 (via `paiement`) |
| (absent) Créer un avoir | n'existe pas | FR-48 |
| Imprimer / PDF | SIMULÉ (`window.print()`) | FR-46 |
| Envoyer au client | SIMULÉ (proforma locale) | FR-47 ; WhatsApp et SMS : bientôt (février 2027) |
| Créer une proforma | local | FR-54 |
| Convertir en commande | SIMULÉ (deux références vides) | FR-56 |
| Relancer par {canal} | SIMULÉ (compteur) | FR-55 |
| Corriger et retransmettre (e-facture) | SIMULÉ | bientôt (date à fixer, plateforme OTR) |
| Transmettre à la plateforme, télécharger l'archive | n'existe pas | bientôt (date à fixer, plateforme OTR) |
| Exporter vers Sage | n'existe pas | bientôt (après février 2027) |

**Notes.**
- **Décision à trancher.** Quel module porte la Créance : `facturation` (nouveau) ou `paiement` (`paiement.creance@1`) ? La spine de la reprise dit « à confirmer ». [ASSUMPTION: `facturation` émet les factures et la suite de numérotation ; la Créance est l'objet commun de la partie 3, alimenté par `facturation` et réduit par `paiement`.]
- **Décision à trancher.** Nombre de séries : une ou plusieurs (par entrepôt, par canal) ? [ASSUMPTION: une série par organisation en février, pour garder « sans trou ni doublon » simple à contrôler.]
- **Question ouverte.** Les factures de vente comptoir sans commande : une facture manuelle suffit-elle ? [ASSUMPTION: oui, FR-42.]
- **Question ouverte.** Le client de février garde-t-il Sage en parallèle ? Si oui, l'export de factures et de paiements est hors périmètre de la phase démontrable et vient après.
- **Question ouverte.** Les factures du client de février contiennent-elles des remises sur plusieurs niveaux, des consignes, des frais de transport ? À obtenir avec le modèle de facture Sage.
- Les relances, la promesse de paiement et le blocage de crédit sont au module partagé Relances et recouvrement (partie 3).

---

### 5.3 Approvisionnement et fournisseurs (`approvisionnement`, M10)

**Dans la démo.** `/approvisionnement` (RESP_STOCK, DG, DAF, COMPTABLE) a quatre onglets : Réappro IA (impact trésorerie, commandes suggérées, « Valider tout »), Commandes fournisseurs (filtre par statut, réception avec écarts), Fournisseurs (registre, score, fiche) et Règles d'automatisation (lecture seule). Le moteur `reappro-engine.ts` est un vrai algorithme ; l'exécution est creuse.
- **SIMULÉ :** « Valider la commande » écrit au journal local, sans créer de commande, sans passer à `ENVOYEE`, sans contrôler le rôle ni le montant. « Basculer sur le fournisseur alternatif » ne recalcule rien. « Valider la réception » affiche « entrée en stock passée » sans écrire (la fonction `receptionner` n'est jamais appelée).
- **N'EXISTE PAS :** créer ou éditer un fournisseur, une commande manuelle, une règle ; payer une échéance.
- **Non appliqués :** les plafonds de validation (un responsable stock peut valider 30 M), le plancher de trésorerie (l'encadré devient rouge, le bouton reste actif), le garde-fou anti-stock-mort sur les commandes suggérées, les deux fournisseurs par produit.
- **Note fournisseur :** `score_fiabilite` est une valeur saisie en dur, jamais recalculée ; le score de sélection est un second calcul, relatif aux candidats. Le point de commande `pointDeCommande` n'est utilisé pour rien.
- **Données :** 10 fournisseurs et 9 à 10 commandes écrits en dur.

**Ce que le module fait.** Il tient le registre des fournisseurs, note chacun, et propose automatiquement les réapprovisionnements dont le stock a besoin. Chaque proposition devient une commande fournisseur qui suit le cycle `SUGGEREE → … → RECUE`. Elle est validée par le bon niveau d'autorité selon son montant. Le plancher de trésorerie la bloque quand elle ferait passer la trésorerie sous 40 M XOF, et elle monte alors au DAF. La réception physique est faite par l'entrepôt (module `entrepot`, FR-71) ; ce module reçoit son résultat. Le module réalise UJ-6.

**Objets.**
- **Fournisseur** : `code` (`FRN-NNN`), `nom`, `categories`, `contact`, `pays`, `statut` (`ACTIF | PREFERENTIEL | SUSPENDU | EN_EVALUATION`), `delai_livraison_j`, `delai_paiement_j`, `franco_de_port`, `minimum_commande`, `remise_volume_pct`, `plafond_credit_accorde`, `note` (0-100) et ses 5 composantes.
- **Article fournisseur** : `article`, `fournisseur`, `prix_achat`, `delai_j`, `quantite_min`, `quantite_lot`, `prioritaire`.
- **Règle de réapprovisionnement** : `article`, `actif`, `seuil_stock`, `couverture_min_jours`, `mode_quantite` (`STOCK_CIBLE | QUANTITE_FIXE | PREVISION`), `stock_cible`, `quantite_fixe`, `niveau_auto` (`ALERTE_SEULE | PROPOSITION | AUTO_SI_SOUS_PLAFOND | AUTO_TOTAL`), `fournisseur_prefere`, `plafond_auto`, `valideur`.
- **Commande fournisseur** : `reference` (`CF-AAAA-NNNN`), `fournisseur`, `point_de_stock_destination`, `statut`, `origine` (`AUTO | MANUELLE`), `lignes`, `montant_ht`, `montant_ttc`, `date_creation`, `date_envoi`, `date_livraison_prevue`, `date_livraison_reelle`, `echeance_paiement`, `statut_paiement` (`NON_DUE | A_PAYER | PARTIEL | PAYEE | ECHUE`), `valide_par`, `valide_le`, `justification`, `fournisseur_alternatif`.
  - Statuts : `SUGGEREE`, `BROUILLON`, `EN_VALIDATION`, `ENVOYEE`, `CONFIRMEE`, `EN_TRANSIT`, `RECUE_PARTIELLE`, `RECUE`, `ANNULEE`, `LITIGE`.
- **Ligne de commande fournisseur** : `article`, `quantite_commandee`, `quantite_recue`, `prix_achat_unitaire`, `total`, `motif` (`SEUIL_ATTEINT | PREVISION_RUPTURE | REGROUPEMENT | MANUEL | PROMO_FOURNISSEUR`).
- **Impact de trésorerie** : `solde_actuel`, `montant_engage`, `solde_projete`, `plancher`, `franchit_plancher`.

#### FR-59 : Registre des fournisseurs

Un responsable stock ou un DAF peut créer, modifier, suspendre et évaluer un fournisseur. Réalise UJ-6.

**Conséquences (testables) :**
- Un fournisseur se crée avec nom, catégories, contact, conditions (délai de livraison, délai de paiement, franco, minimum, remise de volume). Un fournisseur sans nom est refusé.
- Un fournisseur `SUSPENDU` ne reçoit plus de commande suggérée ni manuelle : `FOURNISSEUR_SUSPENDU`. Ses commandes en cours restent visibles.
- Un fournisseur `EN_EVALUATION` peut recevoir des commandes ; son statut est affiché. [ASSUMPTION: la démo ne l'excluait pas du choix.]
- Chaque article stocké doit avoir au moins un fournisseur prioritaire et un fournisseur de secours. Un article avec un seul fournisseur déclenche une alerte au responsable stock. [ASSUMPTION: alerte, pas blocage ; la démo l'écrit en spécification sans le contrôler.]
- La reprise des fournisseurs a un objet de reprise propre, à produire au manifeste (aucun manifeste aujourd'hui). Sans le module, la reprise affiche « module non installé ».
- Les fiches ne sont lues que par DG, RESP_STOCK, DAF, COMPTABLE. Le magasinier n'y a pas accès.

#### FR-60 : Note du fournisseur (30 / 25 / 25 / 10 / 10)

Le module calcule une seule note par fournisseur, de 0 à 100, qui sert à la fois à l'affichage et au choix du fournisseur. Réalise UJ-6.

**Conséquences (testables) :**
- `note = 0,30 × prix + 0,25 × délai réel + 0,25 × fiabilité + 0,10 × dette + 0,10 × franco`.
- Prix, délai et dette sont normalisés entre les fournisseurs candidats pour l'article (le meilleur vaut 100). La fiabilité est le taux de livraisons conformes. Le franco vaut 100 si le montant atteint le franco, sinon `montant / franco × 100`.
- La note est recalculée à chaque réception terminée (délai réel, conformité, litiges). La démo la gardait figée.
- Une note affiche ses cinq composantes et une phrase de justification (écart de prix avec le suivant, délai réel, conformité, encours échu, franco).
- Un fournisseur sans historique affiche « non évaluée » et n'a pas de note par défaut.
- Couleurs : ≥ 80 vert, ≥ 60 ambre, sinon rouge.
- Deux fournisseurs de notes égales sont départagés par le prix le plus bas, puis par le délai réel.

#### FR-61 : Réapprovisionnement proposé automatiquement

Le module propose les réapprovisionnements nécessaires à partir des règles par article. Réalise UJ-6.

**Conséquences (testables) :**
- Un article est « en manque » si `stock ≤ seuil` OU `couverture < couverture_min_jours` (7 jours par défaut). La couverture = stock / vitesse de vente journalière, où la vitesse = ventes des 30 derniers jours / 30. Les deux définitions du seuil sont alignées (≤).
- Le stock lu est le stock disponible du Point de stock (module `stock`). Si `stock` n'est pas installé : « non installé » et aucune proposition.
- Quantité proposée : `QUANTITE_FIXE` → la quantité fixe ; `STOCK_CIBLE` → `max(0, stock_cible − stock)` ; `PREVISION` → `max(0, vitesse × (délai + couverture_min) + vitesse × délai × 1,3 − stock)`. Le résultat est arrondi au multiple supérieur du lot, avec au moins un lot.
- Les propositions d'un même fournisseur sont regroupées en une commande. La remise de volume ne s'applique que si le montant HT atteint le franco.
- Les articles dont la règle est `ALERTE_SEULE` ne produisent qu'une alerte.
- Criticité : `CRITIQUE` si `stock ≤ 0,5 × seuil` ou couverture < 3 jours ; `HAUTE` si sous le seuil ; sinon `MODEREE`.
- Une règle se crée, se modifie et se désactive (RESP_STOCK, DG) ; le bouton « Déclencher maintenant » lance l'évaluation. (Dans la démo, les règles sont en lecture seule.)
- Exemple de test (Grossiste du Golfe) : jus d'orange 1 L, stock 80 caisses, seuil 100, ventes 30 j = 600 → vitesse 20 caisses/j, couverture 4 j ; proposition émise ; criticité `HAUTE`.
- Le point de commande `vitesse × délai × 2,3` est calculé et affiché comme repère, mais le déclenchement se fait sur le seuil de la règle. [ASSUMPTION: on garde le déclenchement de la démo.]

#### FR-62 : Commande fournisseur, de SUGGEREE à RECUE

Un responsable stock peut transformer une proposition en commande fournisseur et la suivre jusqu'à la réception. Réalise UJ-6.

**Conséquences (testables) :**
- Cycle : `SUGGEREE → EN_VALIDATION → ENVOYEE → CONFIRMEE → EN_TRANSIT → RECUE_PARTIELLE | RECUE`. `ANNULEE` et `LITIGE` sont possibles. Une transition interdite renvoie `TRANSITION_INTERDITE`.
- « Valider » crée vraiment la commande (statut `ENVOYEE`, `valide_par`, `valide_le`) et enregistre la ligne dans le registre. « Valider tout » valide chaque commande restante avec les mêmes contrôles ; si une échoue, les autres passent et l'échec est listé.
- La commande fournisseur se crée aussi à la main (fournisseur, lignes, destination).
- L'envoi au fournisseur (e-mail ou PDF) se fait par le module `notification` ; sans lui, le bon de commande se télécharge en PDF et le bouton d'envoi affiche « bientôt ».
- La commande `ENVOYEE`, `CONFIRMEE` ou `EN_TRANSIT` apparaît dans les « réceptions attendues » de l'entrepôt (FR-71).
- La réception (partielle ou totale) renvoyée par l'entrepôt met à jour `quantite_recue`, le statut (`RECUE_PARTIELLE`, `RECUE`, `LITIGE`), la dette fournisseur (FR-67) et la note (FR-60).
- La date de livraison prévue = date d'envoi + délai de livraison du fournisseur. L'échéance de paiement = date de réception + délai de paiement. (La démo calculait à la création.)
- Une commande `SUGGEREE` non traitée en 7 jours est signalée. [ASSUMPTION: 7 jours, paramètre.]

#### FR-63 : Plafonds de validation par montant

Une commande fournisseur n'est validée que par le rôle qui a l'autorité pour son montant. Réalise UJ-6.

**Conséquences (testables) :**
- Jusqu'à 5 000 000 XOF TTC : le responsable stock. Au-dessus de 5 M et jusqu'à 20 M : le DAF. Au-dessus de 20 M : le DG. Valeurs paramétrables par organisation.
- Un rôle qui valide au-dessus de son plafond est refusé : `PLAFOND_VALIDATION_DEPASSE`, avec le rôle qui doit valider. (Dans la démo, un responsable stock validait 30 M.)
- Les bornes sont incluses vers le bas : exactement 5 000 000 se valide par le responsable stock.
- Une commande hors plafond reste `EN_VALIDATION` et apparaît dans la liste « à valider » du bon rôle (badge dans le menu).
- Le valideur ne peut pas être l'auteur d'une commande manuelle de plus de 5 M. [ASSUMPTION: séparation des tâches ; à valider avec le client.]
- Une commande auto ne part sans validation que si la règle est `AUTO_TOTAL`, ou `AUTO_SI_SOUS_PLAFOND` et `montant_ttc ≤ plafond_auto` de la règle. Sinon elle reste `SUGGEREE`.

#### FR-64 : Plancher de trésorerie qui bloque

Une commande qui ferait passer la trésorerie sous 40 000 000 XOF ne part pas : elle monte au DAF. Réalise UJ-6.

**Conséquences (testables) :**
- `solde_projete = solde_actuel − montant engagé`, où le solde actuel est la somme des soldes des comptes de trésorerie de l'organisation, et le montant engagé la somme des TTC des commandes en cours de validation, plus celle que l'on valide.
- Si `solde_projete < plancher` (40 M par défaut, paramétrable), la validation par le responsable stock est refusée : `PLANCHER_TRESORERIE_FRANCHI`. La commande passe `EN_VALIDATION`, étiquetée « escalade DAF », et le DAF est notifié (module `notification`, ou liste « à valider » si le module n'est pas branché).
- Seul le DAF (ou le DG) peut débloquer, avec un motif. La dérogation est tracée.
- L'escalade vaut pour tous les montants. (La démo l'appliquait au journal seulement au-dessus de 20 M.)
- L'encadré « Impact trésorerie » affiche solde actuel, montant engagé, solde projeté, plancher.
- Si aucun module financier n'est installé, le solde affiche « non installé » et le plancher ne peut pas être évalué. La validation reste possible mais l'écran dit « trésorerie non vérifiée ». [ASSUMPTION: décision à trancher : bloquer ou avertir quand la trésorerie est inconnue.]
- **Hors périmètre :** la prévision de trésorerie à 7 jours (module Pilotage financier, partie 3).

#### FR-65 : Fournisseur alternatif

Le module propose un fournisseur alternatif pour chaque commande suggérée et permet d'y basculer. Réalise UJ-6.

**Conséquences (testables) :**
- L'alternatif est le fournisseur suivant au classement de la note (FR-60), hors `SUSPENDU`.
- « Basculer sur {fournisseur} » recalcule les prix d'achat, le franco, la remise de volume, les délais, le montant HT et TTC, puis relance les contrôles de FR-63 et FR-64. (La démo ne recalculait rien.)
- Si un prix manque chez l'alternatif pour un article, la bascule est refusée : `PRIX_FOURNISSEUR_ABSENT`.
- Si un fournisseur est suspendu et qu'un article n'a plus de fournisseur prioritaire, une alerte l'indique au responsable stock.
- La bascule est tracée : qui, quand, ancien fournisseur, nouveau.

#### FR-66 : Garde-fou anti-stock-mort à l'achat

Chaque commande suggérée est contrôlée contre l'achat de stock qui ne se vendra pas. Réalise UJ-6.

**Conséquences (testables) :**
- Cinq motifs : durée de vie (DLC), saison, fin de vie du produit, remise piège, couverture excessive.
- On ne commande pas plus de 70 % de la durée de vie restante en couverture, ni plus de 60 jours de couverture.
- Verdicts : `PASSE`, `ECRETE` (quantité réduite et expliquée), `REFUSE` (motif nommé).
- Le contrôle s'applique à l'écran de réapprovisionnement et à toute commande validée. (Dans la démo il n'était appelé que par le journal d'automatisation.)
- Une quantité écrêtée est affichée à côté de la quantité proposée. Le responsable stock peut passer outre avec un motif.
- Sans durée de vie renseignée sur l'article, le motif DLC affiche « non évalué » et ne bloque pas.

#### FR-67 : Dette fournisseurs et échéancier

Un DAF, un comptable ou un DG voit ce que l'organisation doit à ses fournisseurs. Réalise UJ-6.

**Conséquences (testables) :**
- La réception d'une commande fournisseur crée la dette : `Σ prix_achat × quantité reçue × 1,18` (TVA de l'article), échéance = date de réception + délai de paiement.
- Un litige (FR-72) bloque le paiement de la ligne en cause jusqu'à sa résolution et réduit la dette du montant d'un avoir obtenu.
- Échéancier en tranches : échu, J+7, J+15, J+30, au-delà.
- La balance âgée fournisseurs est la même vue en retard par fournisseur. [ASSUMPTION: elle est incluse ici ; la démo n'en avait pas alors que la spécification v2 la demande.]
- Le statut de paiement (`NON_DUE`, `A_PAYER`, `PARTIEL`, `PAYEE`, `ECHUE`) se met à jour avec les paiements fournisseurs saisis par le DAF.
- Le paiement effectif d'un fournisseur (ordre de virement) relève du Pilotage financier (partie 3). Ici : saisie du paiement et solde.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Note fournisseur | 0,30 prix, 0,25 délai réel, 0,25 fiabilité, 0,10 dette, 0,10 franco | poids : oui | `reappro-engine.ts:129-180` |
| Vitesse de vente | ventes 30 j / 30 | non | `:27-29` |
| Quantité (prévision) | `vitesse × (délai + couv_min) + vitesse × délai × 1,3 − stock`, arrondi au lot | coeff. 1,3 : oui | `:49-72` |
| Couverture minimale par défaut | 10 jours (règle) ; 7 jours (transfert) | oui | `regles-reappro-registry.ts` |
| Criticité | `CRITIQUE` si stock ≤ 0,5 × seuil ou couverture < 3 j ; `HAUTE` si sous seuil | non | `:99-101` |
| Plafonds de validation | 5 M (responsable stock), 20 M (DAF), au-delà DG | oui | `regles-reappro-registry.ts:10-14` |
| Plancher de trésorerie | 40 000 000 XOF | oui | `reappro-engine.ts:24` |
| Auto-envoi | `AUTO_TOTAL`, ou `AUTO_SI_SOUS_PLAFOND` et TTC ≤ plafond de la règle | oui | `:241-243` |
| TVA d'achat | 18 % | par article | `:20` |
| Anti-stock-mort | 70 % de la DLC ; 60 jours de couverture | oui | `garde-fou-achat.ts:62-64` |
| Économie de regroupement | 45 000 XOF si franco atteint (+ remise de volume) ; valeur en dur dans la démo | oui (à calculer) | `:236` |
| Tranches de dette | échu, J+7, J+15, J+30, au-delà | oui | `:373-418` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Valider la commande | SIMULÉ (journal local) | FR-62, FR-63, FR-64, FR-66 |
| Valider tout (N) | SIMULÉ | FR-62 |
| Basculer sur {fournisseur alternatif} | SIMULÉ (rien recalculé) | FR-65 |
| Annuler (validation) | SIMULÉ | FR-62 |
| Valider la réception (côté achats) | SIMULÉ | FR-71 (une seule réception, à l'entrepôt) |
| Saisie des quantités reçues | SIMULÉ | FR-71 |
| Filtres de statut, fiche fournisseur, filtre de règles | LECTURE | FR-59, FR-61 |
| (absent) Créer ou éditer un fournisseur | n'existe pas | FR-59 |
| (absent) Éditer une règle, Déclencher maintenant | n'existent pas | FR-61 |
| (absent) Commande manuelle | n'existe pas | FR-62 |
| (absent) Payer une échéance | n'existe pas | FR-67 (saisie) ; virement réel : bientôt (après février 2027) |
| (absent) Relancer un fournisseur | n'existe pas | bientôt (après février 2027) |
| Envoyer la commande au fournisseur | n'existe pas | FR-62 (e-mail via `notification`) |

**Notes.**
- Ce module n'est pas ★ : le client de février peut acheter à la main. Il est écrit en entier parce que la démo le montre.
- **Décision à trancher.** Un seul processus de réception : l'écran de l'entrepôt (FR-71). L'onglet « Commandes fournisseurs » de l'achat affiche le résultat, ne saisit pas.
- **Question ouverte.** Les achats du client de février sont-ils en XOF uniquement ? Les achats importés (devises, douane, transit) sont hors périmètre. [ASSUMPTION: XOF seulement.]
- **Question ouverte.** Le plancher de 40 M est la valeur de la démo ; le plancher du client de février est à demander.
- Les facture d'achat et leur rapprochement avec la commande et la réception sont au module Comptabilité (partie 3).

---

### 5.4 Opérations entrepôt (`entrepot`, M11)

**Dans la démo.** `/entrepot` (DG, RESP_STOCK, GEST_ENTREPOT) est un poste de travail sans chiffre commercial, avec quatre onglets : Préparation, Expéditions et chargement, Réceptions, Inventaire tournant. Les moteurs `picking-engine`, `expedition-engine`, `reception-engine` et `inventaire-engine` sont de vrais algorithmes.
- **LECTURE :** ouvrir un bon de préparation, voir les expéditions. Aucun bouton pour imprimer un bon, valider une ligne servie, accepter un substitut, démarrer une vague, valider le départ d'un camion.
- **SIMULÉ :** saisie des quantités reçues (pré-remplies avec le commandé), « Valider le contrôle au quai » (le bilan est calculé, mais le stock n'augmente pas, aucun avoir ni litige n'est créé), saisie du compté d'un inventaire (l'écart est calculé, le stock théorique n'est pas ajusté).
- **Deux écrans de réception** (quai et achats) écrivent la même entrée de journal et se télescopent.
- **Pas d'objet Litige** : c'est un booléen, un statut et un compteur.
- **Données en dur :** 6 camions, 5 préparateurs, 2 entrepôts (Lomé Port : 3 200 m², 4 quais, départ à 15:30 ; Kara : 900 m², 1 quai, 14:00). Le nombre d'écarts récents d'inventaire est tiré au hasard.
- **Texte seul :** les « actions automatiques » d'un bilan de réception (mise en stock, avoir préparé, facture fournisseur bloquée, note recalculée).

**Ce que le module fait.** C'est le poste du magasinier. Il prépare les commandes validées, charge les camions, reçoit les marchandises du fournisseur et compte le stock. Chaque action écrit dans le module `stock` : une préparation sort le stock réservé, une réception l'augmente, un inventaire validé le CORRIGE. Le magasinier ne voit jamais un prix ni une marge. Le module réalise UJ-1 (préparation et livraison), UJ-2 (remise des espèces, côté chargement) et UJ-6 (réception avec litige, stock corrigé).

**Objets.**
- **Bon de préparation** : `commande`, `bon_de_livraison`, `point_de_stock`, `client`, `zone`, `priorite`, `score_priorite`, `lignes`, `decision` (`PREPARER | PREPARER_PARTIEL | BLOQUER`), `motif_blocage`, `poids_total`, `volume_total`, `palettes`, `duree_prevue_min`, `statut` (`A_PREPARER | EN_COURS | PREPARE | CHARGE`).
- **Ligne de préparation** : `article`, `quantite_demandee`, `quantite_servie`, `statut` (`SERVABLE | PARTIELLE | RUPTURE`), `emplacement`, `allee`, `ordre_parcours`, `lot`, `substitut`.
- **Vague** : `creneau`, `point_de_stock`, `bons`, `preparateur`, `duree_prevue`, `parcours`, `tenable`.
- **Tournée de livraison** : `camion`, `chauffeur`, `arrets` (client, bon, ordre, heure estimée, encaissement attendu), `remplissage_pct`, `contrainte` (`POIDS | VOLUME`), `distance_km`, `cout`, `depart`, `statut`.
- **Réception** : `commande_fournisseur`, `point_de_stock`, `lignes` (`quantite_recue`, `conforme`, `motif_ecart`), `niveau_controle` (`INTEGRAL | RENFORCE | ALLEGE`), `decisions_d_ecart` (`ACCEPTE | RESERVE | LITIGE | REFUS`), `taux_conformite`, `receptionnaire`, `date`.
- **Litige** : `numero`, `reception`, `fournisseur`, `lignes`, `montant_conteste`, `statut` (`OUVERT | EN_NEGOCIATION | RESOLU_AVOIR | RESOLU_REMPLACEMENT | RESOLU_REFUS | CLOS`), `responsable`, `echeance`, `pieces_jointes`, `resolution`.
- **Comptage d'inventaire** : `article`, `classe` (`A | B | C`), `point_de_stock`, `emplacement`, `quantite_theorique`, `quantite_comptee`, `ecart`, `ecart_pct`, `statut` (`A_COMPTER | EN_RETARD | COMPTE | A_VALIDER | RECOMPTER | VALIDE`), `compteur`, `second_compteur`.

#### FR-68 : Préparer les commandes (picking)

Un magasinier voit les bons de préparation de son entrepôt et les prépare ligne par ligne. Réalise UJ-1.

**Conséquences (testables) :**
- Le carnet est composé des commandes `VALIDEE` et `PREPARATION` du Point de stock, triées par score de priorité (règle de FR-40).
- Le magasinier n'a pas accès au carnet de commandes ni aux prix : il reçoit des bons de préparation.
- Il valide chaque ligne servie avec la quantité réellement préparée et le lot. Il peut déclarer `PARTIELLE` ou `RUPTURE`.
- Un substitut est proposé si un article de même catégorie, même site, a du stock net suffisant et un prix inférieur ou égal à 125 % de l'original. Le substitut n'est servi qu'avec l'accord du bureau. [ASSUMPTION: accord du bureau obligatoire ; la démo ne dit pas qui accepte.]
- Un bon dont le client est bloqué crédit passe `BLOQUER` et ne se prépare pas : `CREDIT_BLOQUE`. Il ne réserve rien.
- Quand toutes les lignes sont servies, le bon est `PREPARE` ; la commande passe `PREPARATION` dès la première ligne servie.
- Le bon s'imprime en PDF : lignes triées dans l'ordre de parcours, emplacement et allée.
- « Aucun prix, marge, CA ni plafond » est une règle de rôle, testée sur toutes les réponses du serveur à ce rôle.

#### FR-69 : Vagues et charge du jour

Un responsable stock regroupe les bons en vagues et voit si l'équipe présente peut sortir le travail avant l'heure de départ. Réalise UJ-1.

**Conséquences (testables) :**
- Les vagues regroupent les bons par zone de livraison, dans trois créneaux : 07:00-09:30, 09:30-12:00, 13:00-heure de départ du site. Un préparateur par vague.
- Une vague est `tenable` si sa durée ne dépasse pas 150 minutes.
- La capacité du jour = `Σ cadence × heures disponibles` des préparateurs présents. Durée d'un bon = `lignes / cadence moyenne × 60` minutes ; cadence par défaut 35 lignes/heure.
- Une alerte s'affiche si le taux de charge dépasse 85 % ou si des lignes sont reportées. Alerte structurelle si l'arriéré dépasse 2 fois les commandes libérées.
- Un préparateur absent se déclare ; la capacité se recalcule.
- Le responsable stock démarre une vague : les bons passent `EN_COURS` avec l'heure et l'auteur.
- Préparateurs et camions sont des données de l'organisation, éditables (RESP_STOCK). [ASSUMPTION: création, modification, absence ; la démo les codait en dur.]

#### FR-70 : Charger les camions et valider le départ

Un magasinier ou un responsable stock charge des bons préparés dans un camion et valide le départ. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le plan de chargement place les bons du plus lourd au plus léger, par zone, dans les camions disponibles triés par charge utile. Il respecte le poids ET le volume.
- Remplissage = `max(poids / charge utile, volume / volume utile)`. Une tournée sous 65 % est signalée « non rentable ».
- Un bon qui ne rentre dans aucun camion disponible est listé « non chargé ».
- « Valider le départ » passe les bons à `EXPEDIE`, enregistre l'heure et le chauffeur, et sort le stock : le Stock réservé devient un mouvement de sortie dans `stock`. Les bons passent `LIVRE` à la confirmation de livraison (FR-36).
- La feuille de route du chauffeur s'imprime (PDF) : arrêts, clients, adresses, encaissement attendu pour chaque arrêt.
- Le chauffeur peut confirmer une livraison et saisir l'encaissement reçu en espèces ; ce montant est ensuite une remise à rapprocher (module Terrain et caisse, partie 3).
- Un camion indisponible se déclare avec le motif ; il sort du plan.
- La signature du client sur l'écran du chauffeur est « bientôt (après février 2027) » ; la photo du bon signé est possible en février.

#### FR-71 : Réception unique de marchandises (contrôle au quai)

Un magasinier reçoit une livraison de fournisseur en comptant ce qui arrive. Il n'y a qu'un seul écran de réception. Réalise UJ-6.

**Conséquences (testables) :**
- Les réceptions attendues sont les commandes fournisseurs `ENVOYEE`, `CONFIRMEE` ou `EN_TRANSIT` du Point de stock. Statut d'attente : `A_QUAI`, `ATTENDU_JOUR` (2 jours ou moins), `EN_RETARD`, `A_VENIR`.
- Les quantités reçues ne sont JAMAIS pré-remplies avec le commandé. Une réception se valide seulement si chaque ligne a une quantité saisie : `QUANTITE_RECUE_NON_SAISIE`. (La démo pré-remplissait.)
- Pour chaque ligne : `ecart_pct = |reçu − commandé| / commandé`. `ACCEPTE` si l'écart est nul ou ≤ 2 % et la ligne conforme ; `RESERVE` si ≤ 5 % ; `LITIGE` au-delà ; `REFUS` si la ligne est marquée non conforme.
- Niveau de contrôle selon le fournisseur : `INTEGRAL` si taux de litige ≥ 5 % ou taux conforme < 90 % ; `RENFORCE` si taux conforme < 97 % ; sinon `ALLEGE`.
- À la validation, la réception met en stock les quantités acceptées (mouvement d'entrée dans `stock`, avec le lot), met à jour la commande fournisseur (`RECUE_PARTIELLE`, `RECUE` ou `LITIGE`, FR-62), crée la dette (FR-67) et ouvre un Litige (FR-72) pour chaque ligne `LITIGE` ou `REFUS`.
- Les actions du bilan ne sont plus du texte : mise en stock, litige ouvert, note recalculée sont effectives.
- Une réception validée ne se modifie plus. Une erreur se corrige par un ajustement de stock tracé (responsable stock).
- Charge des quais : durée d'une réception vs capacité `quais × 8 h × 60 × 0,5` ; saturation signalée.

#### FR-72 : Litiges de réception

Un responsable stock suit chaque litige jusqu'à sa résolution. Réalise UJ-6.

**Conséquences (testables) :**
- Un litige a un numéro, un responsable, une échéance, des pièces jointes (photos du quai) et un historique.
- Il porte le montant contesté = `|écart| × prix d'achat` des lignes en manquant ou refusées. C'est « l'avoir à réclamer ».
- Statuts : `OUVERT → EN_NEGOCIATION → RESOLU_AVOIR | RESOLU_REMPLACEMENT | RESOLU_REFUS → CLOS`. Le montant d'avoir obtenu réduit la dette fournisseur (FR-67).
- Un litige ouvert bloque le paiement de la ligne contestée.
- Le taux de litige du fournisseur est calculé à partir de ces objets, et alimente la note (FR-60) et le niveau de contrôle (FR-71).
- Un litige sans mouvement depuis 15 jours est signalé au responsable stock. [ASSUMPTION: 15 jours, paramètre.]
- Un litige ne se supprime pas ; il se clôt avec un motif.
- Le délai de traitement des litiges est un indicateur du superviseur (partie 3, tableaux de bord).

#### FR-73 : Inventaire tournant par classe ABC

Un responsable stock planifie les comptages ; un magasinier compte. Réalise UJ-6.

**Conséquences (testables) :**
- Le classement ABC se calcule sur la valeur de consommation annuelle au coût d'achat (`ventes 30 j × 12 × coût`). A = cumul jusqu'à 80 %, B = jusqu'à 95 %, C = le reste.
- Fréquences de comptage : A tous les 30 jours, B tous les 90 jours, C tous les 180 jours.
- Une tâche est `EN_RETARD` si le retard dépasse 15 jours, `A_COMPTER` sinon dès l'échéance. Tri : retards, puis écarts récents, puis classe.
- Les « écarts récents » sont les écarts réels des 3 derniers comptages. (Plus de tirage au hasard.) Trois écarts font suspecter l'article.
- Le magasinier saisit la quantité comptée sans voir la quantité théorique. [ASSUMPTION: comptage « en aveugle » ; la démo affichait le théorique.]
- Un article de classe A est recompté par un second magasinier si l'écart dépasse le seuil (FR-74).
- La fiabilité d'inventaire = part des références non suspectes. La démarque sur 90 jours estimée = `Σ stock × 1,5 % × coût` des suspects.

#### FR-74 : Un inventaire validé corrige le stock

La validation d'un comptage corrige le stock dans le module `stock`. Réalise UJ-6.

**Conséquences (testables) :**
- `ecart = compté − théorique` ; `ecart_pct = ecart / théorique`.
- Écart jusqu'à 1 % : ajustement automatique. Écart de 1 à 3 % : validation du responsable stock. Écart au-delà de 3 % : recomptage obligatoire, par deux personnes si l'article est de classe A. Seuils paramétrables.
- Un comptage validé crée un mouvement d'ajustement dans le module `stock` ; `stock` après = quantité comptée. Test : théorique 120, compté 117, écart −3, −2,5 % ; validation du responsable ; le stock disponible devient 117 après la validation.
- Le mouvement porte le comptage, les deux comptes, l'auteur et le motif.
- La valeur de l'écart se calcule au coût d'achat ; elle est visible du responsable stock, pas du magasinier.
- L'annulation d'un comptage non validé ne touche pas le stock. Un comptage validé s'annule par un ajustement inverse tracé.
- Pendant un inventaire de l'article, les sorties restent possibles ; l'écart tient compte des mouvements entre le gel et la validation. [ASSUMPTION: pas de gel du stock ; l'écart est ajusté des mouvements intermédiaires. Décision à trancher.]
- Si `stock` n'est pas installé, aucun comptage ne peut être validé : « non installé ».

#### FR-75 : Poste du magasinier et périmètre

Le gestionnaire d'entrepôt ne voit que son entrepôt, sans prix. Réalise UJ-1.

**Conséquences (testables) :**
- Un magasinier est rattaché à un Point de stock. Il ne lit que les bons, réceptions et comptages de ce point ; l'autre entrepôt est refusé : `POINT_DE_STOCK_HORS_PERIMETRE`.
- Le DG et le responsable stock choisissent l'entrepôt.
- La vue stock du magasinier montre emplacement, stock, réservé, disponible, palettes. Aucun prix, aucune marge, aucun chiffre d'affaires.
- Le magasinier n'a pas accès à la commande ni à l'approvisionnement ; il voit les livraisons attendues dans « Réceptions ».
- Seul le responsable stock ou le DG engage une dépense (transfert, commande, ajustement important).

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Tolérance de réception | 2 % | oui | `reception-engine.ts:19` |
| Seuil de litige | 5 % | oui | `:21` |
| Niveau de contrôle | `INTEGRAL` si litige ≥ 5 % ou conforme < 90 % ; `RENFORCE` si < 97 % | oui | `:103-120` |
| Seuil d'écart d'inventaire | 3 % (≤ 1 % auto) | oui | `inventaire-engine.ts:91` |
| Classes ABC | A ≤ 80 %, B ≤ 95 %, C reste | oui | `:114-163` |
| Fréquence de comptage | A 30 j, B 90 j, C 180 j | oui | `:93` |
| Retard de comptage | `EN_RETARD` au-delà de 15 j | oui | `:176-211` |
| Capacité de préparation | `Σ cadence × heures` ; cadence par défaut 35 lignes/h | oui | `picking-engine.ts:414-418` |
| Vague tenable | durée ≤ 150 min | oui | `:430-487` |
| Remplissage rentable | ≥ 65 % | oui | `expedition-engine.ts:20` |
| Charge des quais | `quais × 8 h × 60 × 0,5` | oui | `reception-engine.ts:300-319` |
| Substitut | même catégorie, même site, prix ≤ 125 % | oui | `picking-engine.ts:228-249` |
| Score de priorité | voir 5.1 | non en février | `:176-196` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Ouvrir ou replier un bon | LECTURE | FR-68 |
| (absent) Imprimer le bon, valider une ligne servie, accepter un substitut | n'existent pas | FR-68 |
| (absent) Démarrer une vague | n'existe pas | FR-69 |
| (absent) Valider le départ camion, feuille de route, signature | n'existent pas | FR-70 ; signature : bientôt (après février 2027) |
| Saisie des quantités reçues (pré-remplies) | SIMULÉ | FR-71 (jamais pré-remplies) |
| Valider le contrôle au quai | SIMULÉ (rien n'est mis en stock) | FR-71 |
| Annuler (réception, comptage) | SIMULÉ | FR-71, FR-74 (correction par ajustement tracé) |
| Saisie « compté » + Valider (inventaire) | SIMULÉ (stock non corrigé) | FR-73, FR-74 |
| Choix de l'entrepôt (RESP_STOCK, DG) | LECTURE | FR-75 |
| (absent) Suivre un litige | n'existe pas | FR-72 |

**Notes.**
- **Décision à trancher.** Les transferts entre entrepôts (« Lancer la navette ») et les plans de liquidation (« Lancer le scénario ») appartiennent au PRD `stock` (renvoi, partie 4). Ils sont SIMULÉS dans la démo ; le module `entrepot` exécute le mouvement physique d'un transfert quand `stock` le décide.
- **Question ouverte.** Le client de février a-t-il un ou plusieurs entrepôts ? Y a-t-il des quais, des emplacements, des lots à date limite ? [ASSUMPTION: Grossiste du Golfe a 2 entrepôts, des emplacements, et des lots à date limite pour les jus.]
- Le suivi GPS des camions et la preuve de livraison électronique sont hors périmètre de février.
- Le lien entre le chargement et la remise d'espèces du chauffeur est décrit à la partie 3.

---

### 5.5 Conquête, territoires, objectifs et quotas (`conquete-objectifs`, M13)

**Dans la démo.** `/prospection` (« Conquête et Territoires », DG, DC, RESP_VENTES, PROSPECTION) a quatre onglets : Territoires (carte, zones, recensement), Carnet de prospects (entonnoir, motifs de perte), Ouvertures et survie (cohortes), Passation. `/objectifs` (DG, DC, RESP_VENTES, CONTROLE_GESTION) montre l'allocation par zone, l'atterrissage, le mix produit et la marge. Il n'a aucun bouton.
- **SIMULÉ :** « Activer le recensement » et le clic sur la carte (un `window.prompt` pour le nom) écrivent un prospect recensé dans le navigateur, qui n'alimente ni le carnet ni les chiffres. « Transférer » (passation) écrit un transfert local sans prévenir le commercial et sans l'ajouter à sa tournée. La corbeille retire un prospect local.
- **N'EXISTE PAS :** contacter, planifier une visite, faire avancer d'étape, marquer perdu, créer l'ouverture, nouveau prospect ; saisir ou réallouer un quota ; objectif par commercial ou par point de vente.
- **Chiffres fabriqués :** l'objectif du point de vente vaut `CA × 1,1` (circulaire) ; les objectifs de zone utilisent 11 jours écoulés sur 26 en dur ; le mix produit est identique pour tous les périmètres ; la « distribution numérique » est un proxy (`couverture × 0,82`).
- **À reprendre tel quel :** les garde-fous de conquête (`REGLES_CONQUETE`), qui sont des règles métier explicites.

**Ce que le module fait.** Il aide le chargé de prospection à ouvrir de nouveaux points de vente qui durent. Il montre les zones non couvertes, tient le carnet de prospects, empêche les ouvertures risquées par des garde-fous qui BLOQUENT, suit la survie des ouvertures à un et trois mois, calcule leur valeur nette, et organise la passation au commercial du secteur. Il porte aussi les objectifs par zone, par commercial et par point de vente, la projection de fin de mois et le mix produit. Le module réalise UJ-7 (l'ouverture qui tient).

**Objets.**
- **Zone de conquête** : `zone`, `commercial`, `statut` (`A_RECENSER | RECENSEMENT_EN_COURS | EN_CONQUETE | COUVERTE | ABANDONNEE`), `pdv_estimes`, `pdv_recenses`, `pdv_ouverts`, `distance_depot_km`, `cout_service_mois`, `potentiel_ca_mois`, `concurrent_installe`.
- **Prospect** : `nom`, `zone`, `quartier`, `telephone`, `adresse`, `lat`, `lng`, `type_commerce`, `surface_m2`, `ca_estime_mois`, `capacite_paiement` (`COMPTANT | CREDIT_7J | CREDIT_30J | INCONNUE`), `concurrent_fournisseur`, `etape` (`RECENSE | QUALIFIE | PREMIER_CONTACT | OFFRE_ENVOYEE | PREMIERE_COMMANDE | PERDU`), `jours_dans_etape`, `commercial`, `source` (`RECENSEMENT | SOCIAL | RECOMMANDATION | AUTRE`), `motif_perte`, `prochaine_action`, `prochaine_action_date`, `historique`.
- **Ouverture** : `point_de_vente`, `zone`, `commercial`, `mois_ouverture`, `ca_premiere_commande`, `conditions_premiere_commande`, `reachat_m1`, `reachat_m3` (`vrai | faux | non jugeable`), `impaye`, `sante` (`VIVANT | DORMANT | MORT | IMPAYE`), `cout_acquisition`, `marge_cumulee`, `transfere_a`, `jours_depuis_ouverture`.
- **Passation** : `ouverture`, `commercial_secteur`, `date`, `auteur`, `statut` (`EN_ATTENTE | ACCEPTEE`).
- **Objectif** : `perimetre` (`ZONE | COMMERCIAL | POINT_DE_VENTE`), `cible`, `periode` (mois), `indicateur` (`CA | MARGE | VISITES | NOUVEAUX_PDV | ENCAISSEMENT | DN`), `valeur`, `fixe_par`, `date`.
- **Garde-fous de conquête** : paramètres de l'organisation (voir FR-79).

#### FR-76 : Zones non couvertes et recensement

Un chargé de prospection voit les zones non couvertes et recense les commerces qu'il y trouve. Réalise UJ-7.

**Conséquences (testables) :**
- Une carte montre les zones colorées par statut et les commerces recensés. Les zones sont celles du module `reseau`. [ASSUMPTION: la carte utilise Google Maps, choix du PO pour le module `pdv`.]
- « Recenser » ouvre un formulaire (nom, type de commerce, téléphone, adresse) et prend les coordonnées du point pointé ou de la position du téléphone. Il remplace le `window.prompt` de la démo.
- Un commerce recensé crée un Prospect `RECENSE` dans le carnet (FR-77) et augmente le compteur de la zone. La démo gardait deux listes séparées.
- Doublon : un commerce de même téléphone, ou à moins de 30 mètres avec un nom proche d'un prospect ou d'un point de vente existant, est signalé avant création. [ASSUMPTION: règle de proximité du module `pdv`, 30 m à confirmer.]
- Chaque zone affiche : statut, distance au dépôt, coût de desserte mensuel, potentiel, concurrent installé, recensement (recensés / estimés), conversion (ouverts / recensés).
- La rentabilité de la desserte = `cout_service_mois / potentiel_ca_mois`; rouge au-dessus de 15 %. La conversion est verte à 20 % et plus.
- Le chargé de prospection modifie le statut d'une zone (démarrer le recensement, mettre en conquête, abandonner) avec un motif.

#### FR-77 : Carnet de prospects

Un chargé de prospection tient son carnet de prospects et fait avancer chacun d'étape en étape. Réalise UJ-7.

**Conséquences (testables) :**
- Un prospect se crée à la main, par recensement (FR-76) ou depuis le studio social (FR-92).
- Étapes : `RECENSE → QUALIFIE → PREMIER_CONTACT → OFFRE_ENVOYEE → PREMIERE_COMMANDE`, ou `PERDU` à tout moment avec un motif obligatoire.
- Une étape se franchit par action (« Qualifier », « Contacter », « Envoyer l'offre ») qui enregistre l'auteur, la date et une note. Passer à `OFFRE_ENVOYEE` crée une proforma (FR-54).
- La prochaine action et sa date sont des champs qui apparaissent dans la tournée du chargé (module `visites`).
- Un prospect de plus de 21 jours dans la même étape est « bloqué » (FR-79).
- Le score de santé 0 à 100 d'un prospect est « non défini » tant qu'aucune formule n'est arrêtée. [ASSUMPTION: la démo saisit le score à la main, sans formule ; on l'affiche seulement s'il est calculé.] Décision à trancher.
- Un prospect passe à `PREMIERE_COMMANDE` quand sa première commande est livrée (FR-80), pas à la saisie.
- Un commercial ne voit que ses prospects ; un responsable des ventes ceux de ses zones.

#### FR-78 : Entonnoir et goulot

Un responsable des ventes lit l'entonnoir de conquête et voit où les prospects se bloquent. Réalise UJ-7.

**Conséquences (testables) :**
- Pour chaque étape : nombre de prospects non perdus ayant atteint cette étape ou une étape plus avancée, pourcentage des recensés, nombre de « bloqués » (plus de 21 jours dans l'étape).
- Le goulot = l'étape qui a le plus de dossiers bloqués.
- Les motifs de perte sont classés évitables ou non évitables (concurrent exclusif, exclusivité = non évitable).
- Le résultat est calculé sur les prospects enregistrés, pas sur un registre fixe.
- Un entonnoir sans prospect affiche 0 prospect et « aucun goulot ».

#### FR-79 : Garde-fous de la première commande et du carnet

Les règles de conquête BLOQUENT l'action risquée. Elles sont des Garde-fous, paramétrables par organisation. Réalise UJ-7.

**Conséquences (testables) :**
- **Plafond de crédit de la première commande : 1 500 000 XOF.** Une première commande à crédit au-dessus de ce montant est refusée à la validation (module `commande`, FR-33) : `PLAFOND_PREMIERE_COMMANDE`. Levée possible : acompte de 50 %, ou validation du DAF avec motif.
- **Prospect à crédit de 30 jours avec un CA estimé supérieur à 2 fois le plafond (3 M)** : acompte de 50 % exigé ou validation du DAF.
- **Distance maximale rentable : 35 km du dépôt.** Un prospect au-delà ne peut pas passer à `OFFRE_ENVOYEE` sans validation du responsable des ventes : `DISTANCE_AU_DELA_DU_RENTABLE`.
- **Dossier dormant : 21 jours** sans contact dans la même étape. Le dossier est signalé ; le chargé le relance ou le clôture avec un motif. Un dossier au score élevé (60 et plus, si le score existe) est signalé « fort potentiel ».
- **Passation : 45 jours.** Une ouverture `VIVANT` ou `DORMANT` sans commercial de secteur au bout de 45 jours est « orpheline » (FR-83).
- Chaque refus nomme le garde-fou, la valeur du paramètre et la valeur constatée. Le paramétrage est réservé à l'administrateur de l'organisation.
- Un garde-fou ne se contourne que par la dérogation prévue, avec motif et auteur.
- Les alertes sont triées `CRITIQUE`, `HAUTE`, `MOYENNE`.

#### FR-80 : Créer l'ouverture à la première commande livrée

Quand un prospect passe sa première commande, le point de vente est créé et l'ouverture est suivie. Réalise UJ-7.

**Conséquences (testables) :**
- À la validation de la première commande d'un prospect, le module `pdv` crée le point de vente (pipeline `PREMIERE_COMMANDE`) et le lie au prospect. Si `pdv` n'est pas installé, l'ouverture affiche « non installé » et ne peut pas être créée.
- Une Ouverture est créée avec la date, le montant et les conditions de la première commande, le coût d'acquisition et le commercial.
- La première commande est soumise aux garde-fous de FR-79.
- Un prospect déjà point de vente ne peut pas être ouvert deux fois : `PROSPECT_DEJA_CLIENT`.
- Le coût d'acquisition = coûts de visite et de desserte imputés à l'ouverture. [ASSUMPTION: méthode d'imputation à définir avec le contrôle de gestion ; la démo stocke une valeur.]
- La date de l'ouverture est celle de la première commande livrée.

#### FR-81 : Survie des ouvertures à M+1 et M+3

Le module suit si un point de vente ouvert recommande. Réalise UJ-7.

**Conséquences (testables) :**
- `reachat_m1` est vrai si une deuxième commande est passée dans le mois qui suit l'ouverture. `reachat_m3` est vrai si le point de vente commande encore dans le troisième mois.
- Un `reachat_m3` d'une ouverture de moins de 3 mois est « non jugeable » et n'entre pas dans le calcul.
- Réachat M+1 = `ouvertures avec reachat_m1 / total des ouvertures`. Survie M+3 = `ouvertures avec reachat_m3 = vrai / ouvertures jugeables`. Vert à 60 % et plus (M+1), à 70 % et plus (M+3).
- Santé d'une ouverture : `VIVANT`, `DORMANT`, `MORT`, `IMPAYE` (constaté trois mois après la première commande).
- La cohorte par mois d'ouverture affiche vivants, dormants, morts, impayés.
- Les calculs lisent les commandes réelles du module `commande`. Sans lui : « non installé ».

#### FR-82 : Valeur nette d'une ouverture

Le module calcule ce que rapporte réellement un portefeuille d'ouvertures. Réalise UJ-7.

**Conséquences (testables) :**
- `valeur_nette = marge_cumulee − cout_acquisition − impayes`.
- La marge cumulée vient des factures (FR-53). Si la marge est « non calculable », la valeur nette l'est aussi.
- Une valeur nette négative affiche le bandeau « Le portefeuille d'ouvertures détruit de la valeur ».
- Le total du portefeuille est la somme des valeurs nettes des ouvertures, par commercial, par zone et par mois.
- Exemple de test : marge cumulée 180 000, coût d'acquisition 60 000, impayé 150 000 → valeur nette −30 000.
- Le chiffre alimente les indicateurs du poste du chargé de prospection (partie 3).

#### FR-83 : Passation (« Transférer ») au commercial du secteur

Un chargé de prospection passe une ouverture au commercial du secteur du point de vente. Réalise UJ-7.

**Conséquences (testables) :**
- La file de passation liste les ouvertures `VIVANT` ou `DORMANT` sans commercial de secteur, triées par ancienneté.
- Une ouverture est « orpheline » après 45 jours. Les jours de retard s'affichent.
- « Transférer » ouvre une liste des commerciaux du secteur du point de vente (module `reseau`), pas un `window.prompt`. Le commercial par défaut est celui de la zone.
- Le transfert change le commercial du point de vente dans le module `pdv` (affectation). Le point de vente apparaît dans le portefeuille et la tournée du commercial du secteur ; il sort de celui du chargé.
- Le commercial reçoit une notification (module `notification`) ; s'il n'est pas branché, la passation apparaît dans sa liste « passations à accepter ».
- Un transfert se défait (« Annuler le transfert ») tant que le commercial n'a pas accepté.
- Un point de vente dont l'ouverture est transférée reste suivi en survie (FR-81).
- Un commercial freelance ne peut pas recevoir une passation sans l'add-on Freelance (FR-93).

#### FR-84 : Objectifs par zone, par commercial et par point de vente

Un responsable des ventes ou un DC fixe les objectifs d'un mois. Réalise UJ-7 et UJ-1.

**Conséquences (testables) :**
- Un objectif a un périmètre (zone, commercial ou point de vente), une période (mois), un indicateur (CA, marge, visites, nouveaux points de vente, encaissement, distribution numérique) et une valeur. (La démo n'a qu'un quota de zone.)
- Le responsable des ventes pilote par zone et fixe les objectifs de zone ; il répartit ensuite sur les commerciaux. La somme des objectifs des commerciaux d'une zone ne dépasse pas l'objectif de zone sans avertissement. [ASSUMPTION: avertissement et non blocage.]
- L'objectif du point de vente est saisi, pas déduit du CA. (La démo prenait `CA × 1,1`.)
- Un objectif se modifie en cours de mois avec un historique ; le changement n'efface pas la valeur d'origine.
- La reprise des objectifs d'un fichier est possible (CSV). [ASSUMPTION: format du fichier à définir.]
- Un commercial lit ses propres objectifs ; il ne lit pas ceux des autres.
- Sans objectif saisi, l'avancement affiche « aucun objectif » et pas un pourcentage fabriqué.

#### FR-85 : Atterrissage et projection de fin de mois

Le module projette le résultat du mois à partir du rythme réel. Réalise UJ-1.

**Conséquences (testables) :**
- `ca_realise` = factures émises (HT) du périmètre sur le mois à date. `rythme_actuel_jour = ca_realise / jours ouvrés écoulés`. `atterrissage = rythme_actuel_jour × jours ouvrés du mois`. `ecart_projete = atterrissage − quota`. `rythme_requis_jour = max(quota − réalisé, 0) / jours ouvrés restants`.
- Les jours ouvrés viennent d'un calendrier de l'organisation (dimanche non travaillé, jours fériés déclarés). La démo posait 11 sur 26 en dur.
- Statut de zone : `TIENT` si atterrissage ≥ quota, `JUSTE` si ≥ 92 % du quota, sinon `DECROCHE`.
- Les chiffres lisent les factures du module `facturation`; sans lui : « non installé ».
- Une zone sans objectif n'a pas de statut.
- Les arbitrages à rendre (zone qui décroche : exécution ou panier ; surperformance : réallouer ; CA non encaissé : geler le crédit) sont recalculés sur ces chiffres. Chaque arbitrage est une proposition, pas une action.

#### FR-86 : Mix produit, marge et distribution numérique

Un DG, un DC ou un responsable des ventes lit le mix produit et la marge du périmètre. Réalise UJ-1.

**Conséquences (testables) :**
- Le mix = part du CA par famille d'articles (famille du module `catalogue`), sur les factures du périmètre. Il change selon le périmètre ; il n'est plus une constante.
- Marge du mix = `Σ part × marge de la famille`. Cible de marge paramétrable (16,5 % dans la démo).
- Une famille est « sur-représentée et peu margée » si sa part dépasse la cible de plus de 2 points et que sa marge est sous la cible de marge.
- Distribution numérique (DN) = points de vente ayant commandé dans la période / points de vente actifs du portefeuille. (La démo utilisait un proxy.) Vert à 75 % et plus.
- Une marge « non calculable » exclut la famille et l'indique.
- Les familles (boissons, jus, eaux, etc.) viennent du catalogue de l'organisation, pas de cinq familles fixes.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Plafond de la 1re commande à crédit | 1 500 000 XOF | oui | `prospection-registry.ts:114-123` |
| Distance maximale rentable | 35 km | oui | idem |
| Jours maximum sans contact | 21 | oui | idem |
| Jours avant passation | 45 | oui | idem |
| Acompte exigé | 50 % | oui | `prospection-builder.ts:224-307` |
| Seuil de CA estimé à crédit | 2 × plafond (3 M) | oui | idem |
| Réachat M+1 | `réachat_m1 / total` ; vert ≥ 60 % | seuil : oui | `:139,168` |
| Survie M+3 | `réachat_m3 vrai / jugeables` ; vert ≥ 70 % | seuil : oui | `:137-138,167` |
| Valeur nette | marge cumulée − coût d'acquisition − impayés | non | `:173` |
| Rentabilité de desserte | `coût de service / potentiel` ; rouge > 15 % | seuil : oui | `ConqueteView.tsx:434-436` |
| Conversion de zone | `ouverts / recensés` ; vert ≥ 20 % | seuil : oui | `:421` |
| Atterrissage | `rythme × jours ouvrés` ; `TIENT` ≥ 100 %, `JUSTE` ≥ 92 % | oui | `objectifs-builder.ts:111-143` |
| Cible de marge du mix | 16,5 % | oui | `:103` |
| DN verte | ≥ 75 % | oui | `ObjectifsView.tsx:70` |
| Indicateurs du poste « prospection » | survie M+3 (30), recensé → 1re commande (25), impayé 1re commande (20), coût d'acquisition (15), ouvertures transférées (10) | poids : oui | `kpi-postes-registry.ts:155-172` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Activer le recensement / carte | SIMULÉ (`window.prompt`, liste locale) | FR-76 |
| Corbeille « Retirer ce prospect recensé » | SIMULÉ | FR-77 (retrait avec motif) |
| Transférer (passation) | SIMULÉ (rien notifié) | FR-83 |
| Annuler le transfert | existe dans le contexte, aucun bouton | FR-83 |
| Onglets, sélection de zone ou de prospect | BRANCHÉ (état local) | FR-76 à FR-78 |
| (absent) Contacter, planifier une visite | n'existent pas | FR-77 (via la tournée, partie 3) |
| (absent) Faire avancer d'étape, marquer perdu | n'existent pas | FR-77 |
| (absent) Nouveau prospect, créer l'ouverture | n'existent pas | FR-77, FR-80 |
| (absent) Saisir ou réallouer un quota | n'existe pas | FR-84 |
| (absent) Simuler une réallocation | n'existe pas | bientôt (après février 2027) |
| Rendre un arbitrage (« Transférer 1 commercial ») | texte seul | bientôt (après février 2027) |

**Notes.**
- **Décision à trancher.** Les statuts de zone `COUVERTE` et `ABANDONNEE` : qui les pose et sur quels critères ? [ASSUMPTION: le responsable des ventes, à la main, avec motif.]
- **Question ouverte.** La segmentation actifs, dormants et VIP des points de vente n'existe pas dans le code. Si le PO la veut, elle se spécifie au module `pdv`.
- **Question ouverte.** Les ouvertures du client de février : combien par mois ? La conquête n'est pas ★ pour février.
- Le score de santé 0 à 100 d'un point de vente n'a pas de formule dans la démo. Il relève du module `pdv`.
- Les indicateurs d'équipe (classements, rémunération) sont au module Équipes et performance (partie 3). La rémunération individuelle n'est pas visible d'un superviseur ni d'un contrôleur de gestion. [ASSUMPTION: écart de la démo (`/equipe`) à corriger dans la partie 3.]

---

### 5.6 Studio réseaux sociaux (`studio-social`, M24)

**Dans la démo.** `/marketing/social` (DG, DC, MARKETING) a cinq onglets : calendrier éditorial, idées et modèles, boîte de réception unique, performance, journal. Quatre canaux : WhatsApp (canal de vente), Facebook, TikTok, Instagram (compte non connecté).
- **BRANCHÉ dans la démo (objets créés, relus dans le calendrier) :** composer un nouveau post, dupliquer vers un autre réseau.
- **SIMULÉ :** « Valider et programmer » (le post affiche « programmé », rien n'est publié), réécrire, éditer, replanifier, supprimer ; « Envoyer » une réponse (aucun message ne part) ; « Créer le lead » (aucun lead créé).
- **MORT :** la réponse automatique « part dans 2 minutes sauf annulation » (aucune minuterie) ; connecter un compte.
- **« IA » :** les trois accroches proposées sont des gabarits par angle (`social-builder.ts:382-440`), pas un modèle de langage. Le calendrier de 7 jours est généré à partir des combos de stock, de la disponibilité et des zones blanches.
- **Chiffres :** coût mensuel de 420 000 F et marge incrémentale de 13 % en dur.

**Ce que le module fait.** Il prépare des publications pour WhatsApp, Facebook, TikTok et Instagram à partir de ce que le distributeur doit écouter ou vendre : stock à écouler, produits disponibles, zones à conquérir. Le responsable marketing valide chaque publication. Il reçoit les messages des clients dans une boîte unique, y répond, et transforme un message d'intérêt en prospect. **Ce qui part réellement en février : rien automatiquement.** Un post validé est rangé « À publier » avec son texte et son visuel prêts à copier ; la publication automatique par réseau est un bouton « bientôt ». La réponse à un client sur WhatsApp passe par le module `notification` quand il est branché. Le module réalise UJ-7 (le lead qui devient un prospect) et nourrit UJ-1 (promotion d'un stock à écouler).

**Objets.**
- **Compte social** : `reseau` (`WHATSAPP | FACEBOOK | TIKTOK | INSTAGRAM`), `identifiant`, `connecte` (`vrai | faux`), `date_connexion`.
- **Publication** : `date`, `heure`, `reseau`, `angle` (`ECOULEMENT | PROMO | PREUVE_SOCIALE | EDUCATION | DISPONIBILITE | ACQUISITION`), `statut` (`BROUILLON | A_VALIDER | PROGRAMME | A_PUBLIER_A_LA_MAIN | PUBLIE | ECHEC | ANNULE`), `accroche`, `corps`, `hashtags`, `appel_a_l_action`, `visuel`, `article`, `pourquoi` (raison commerciale), `source` (`MANUEL | PROPOSITION`), `validee_par`, `resultats` (portée, clics, leads, commandes).
- **Message reçu** : `reseau`, `auteur`, `contenu`, `recu_le`, `intention` (`COMMANDE | RECLAMATION | PRIX | DISPONIBILITE | PARTENARIAT | SPAM`), `delai_de_reponse` (heures), `reponse_suggeree`, `statut` (`NOUVEAU | REPONDU | TRANSFERE | LEAD_CREE | IGNORE`), `prospect`.
- **Rythme commercial** : `nom`, `periode` (semaine de paie 22-25, veille de marché, pic de chaleur, week-end).

#### FR-87 : Calendrier des publications

Un responsable marketing compose, modifie et planifie les publications d'un calendrier, par réseau. Réalise UJ-7 (en amont) et UJ-1.

**Conséquences (testables) :**
- Un post se crée à la main, depuis une idée, depuis un modèle ou depuis une proposition (FR-88). Il a un statut parmi `BROUILLON`, `A_VALIDER`, `PROGRAMME`, `A_PUBLIER_A_LA_MAIN`, `PUBLIE`, `ECHEC`, `ANNULE`.
- Le calendrier existe en vue liste et en vue semaine ; il filtre par réseau et par angle.
- Un post peut être modifié, replanifié, dupliqué vers un autre réseau (adapté en heure, longueur, hashtags et lien WhatsApp), supprimé ou rétabli. Ces actions sont enregistrées côté serveur.
- Le DG et le DC voient le calendrier ; ils ne rédigent pas. [ASSUMPTION: droit de lecture seule du DG, comme dans la démo (`route-access.ts:47`).]
- Les rythmes commerciaux (semaine de paie, veille de jour de marché, pic de chaleur) sont des repères paramétrables.
- Tout post enregistré est relu par les autres rôles autorisés (il ne disparaît pas au rechargement).

#### FR-88 : Accroches proposées

Le module propose trois variantes d'accroche et des posts à partir des données de l'organisation. Réalise UJ-1.

**Conséquences (testables) :**
- Les propositions s'appuient sur des données lues dans les autres modules : stock à écouler (module `stock`), disponibilité, zones non couvertes (FR-76). Un module non installé retire sa source avec la mention « non installé ».
- Chaque proposition affiche sa raison commerciale (« pourquoi ») et un score d'engagement estimé, étiqueté « estimation ».
- Les trois variantes d'accroche (urgence, bénéfice, question) sont générées à partir de gabarits ; l'écran dit « proposé par modèle de texte » tant qu'aucun assistant IA n'est branché. Le mot « IA » n'est utilisé que si un assistant génère réellement le texte. [ASSUMPTION: module `assistant` (assistant-service) branché plus tard ; en février, gabarits.]
- Le choix d'une variante remplace l'accroche du post et est tracé.
- Une proposition qui contient un prix, un stock ou une promotion cite la valeur lue au moment de la proposition, et signale si elle a changé avant la validation.
- Une promotion de stock à écouler respecte le seuil de validation du DG (12 % de remise dans la démo).

#### FR-89 : Valider et programmer une publication

Le responsable marketing valide un post, qui devient prêt à partir. Réalise UJ-1.

**Conséquences (testables) :**
- « Valider et programmer » passe le post de `A_VALIDER` à `PROGRAMME` (réseau connecté) ou à `A_PUBLIER_A_LA_MAIN` (réseau non connecté). L'auteur et l'heure sont tracés.
- **Ce qui part réellement en février :** rien automatiquement. Un post `A_PUBLIER_A_LA_MAIN` affiche le texte, les hashtags et le visuel à copier, avec le rappel de l'heure choisie. Le responsable le publie lui-même puis marque « Publié ».
- Pour chaque réseau, un bouton « Publier automatiquement » est désactivé avec « bientôt » : WhatsApp (via `notification`) bientôt (février 2027) ; Facebook, Instagram et TikTok bientôt (après février 2027) ; chacun dépend de la connexion du compte et de l'API du réseau.
- Jamais le statut `PUBLIE` ne s'affiche sans un retour réel du réseau ou une confirmation manuelle de l'utilisateur, étiquetée « marqué publié à la main ».
- Un échec de publication passe le post à `ECHEC` avec la raison, et alerte le responsable.
- Un post avec une remise au-dessus du seuil de validation du DG attend l'accord du DG (`EN_ATTENTE_DG`).
- Les résultats (portée, clics, leads, commandes) d'un post ne s'affichent que s'ils viennent d'une source réelle ; sinon « non disponible ».

#### FR-90 : Boîte de réception unique

Le responsable marketing et le bureau voient les messages de tous les réseaux dans une seule liste, triée par potentiel. Réalise UJ-7.

**Conséquences (testables) :**
- Chaque message a une intention (commande, réclamation, prix, disponibilité, partenariat, spam) et un délai de réponse cible : 1 h pour commande et réclamation, 2 h pour prix et disponibilité, 24 h pour partenariat. Un message hors délai est marqué.
- Le spam est écarté de la liste principale.
- **Ce qui entre réellement en février :** la saisie manuelle d'un message (copier-coller depuis le téléphone) avec son réseau et son auteur. La réception automatique des messages est un bouton « bientôt (après février 2027) » par réseau. [ASSUMPTION: dépend des connecteurs WhatsApp Business, Meta et TikTok.]
- La classification d'intention est faite par règles de mots-clés ; l'écran affiche sa confiance et dit « classement automatique ». L'utilisateur peut la corriger.
- Un message d'un client en impayé ne reçoit pas de réponse automatique : il est transféré au recouvrement (FR-91).
- Un message de commande peut ouvrir une commande (FR-38, canal `WHATSAPP`).

#### FR-91 : Répondre à un message

Un responsable marketing répond à un message, avec un garde-fou sur les clients en impayé. Réalise UJ-7.

**Conséquences (testables) :**
- La réponse suggérée est un texte modifiable. « Modifier » ouvre un éditeur.
- « Envoyer » ne s'active que si le réseau du message est branché à un moyen d'envoi réel : WhatsApp via `notification` (bientôt, février 2027), les autres réseaux bientôt. Sinon le bouton affiche « bientôt » et propose « Copier la réponse ». (La démo affichait « réponse envoyée » sans envoi.)
- Un message d'un client dont la Créance échue dépasse le garde-fou est marqué « NE PAS RÉPONDRE AUTOMATIQUEMENT » et transféré au recouvrement (partie 3). La réponse automatique est interdite dans ce cas : `REPONSE_AUTO_INTERDITE_CLIENT_EN_IMPAYE`.
- Les réponses automatiques (« part dans 2 minutes sauf annulation ») n'existent pas en février. Le texte et le bouton sont retirés tant qu'aucun envoi réel n'est branché.
- Chaque réponse est tracée : auteur, heure, canal, texte.

#### FR-92 : Créer un lead qui devient un prospect

Depuis un message d'intérêt, un responsable marketing crée un prospect dans le carnet de conquête. Réalise UJ-7.

**Conséquences (testables) :**
- « Créer le lead » crée un Prospect (FR-77) à l'étape `RECENSE`, avec la source `SOCIAL`, le réseau, le nom, le téléphone et le message d'origine. (La démo n'écrivait que dans son journal.)
- Le prospect apparaît dans le carnet de la zone concernée, assigné au chargé de prospection de la zone.
- Un prospect de même téléphone existant est signalé : pas de doublon. Un point de vente déjà client est signalé : `PROSPECT_DEJA_CLIENT`.
- Le message passe à `LEAD_CREE` et garde le lien vers le prospect.
- L'attribution (lead → commande → CA) se lit sur le prospect et l'ouverture. Le CA « incrémental » (nouveaux clients et réactivations) n'est affiché que s'il se calcule à partir de ces liens.
- Sans le module `conquete-objectifs` installé, « Créer le lead » est remplacé par « Copier les coordonnées ». « non installé » s'affiche pour le carnet.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Délais de réponse | commande et réclamation 1 h ; prix et disponibilité 2 h ; partenariat 24 h | oui | `social-builder.ts:539-557` |
| Calendrier généré | WhatsApp chaque matin ouvré ; Facebook lundi, jeudi et mardi ; TikTok mercredi et vendredi soir | oui | `:243-277` |
| Seuil de validation DG | remise ≥ 12 % | oui | `combo-stock-workflow.ts:7` |
| Marge incrémentale | 13 % du CA incrémental | oui (ou calculée) | `:356-377` |
| Coût mensuel du studio | 420 000 F en dur | à saisir | `:356-377` |
| ROI | `(marge incrémentale − coût) / coût` | non | idem |
| Rythmes commerciaux | semaine de paie 22-25 ; veille de marché ; chaleur juin-septembre ; jeudi | oui | `social-registry.ts:75-107` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Nouveau post, depuis une idée ou un modèle | BRANCHÉ (objet local) | FR-87 |
| Dupliquer vers un autre réseau | BRANCHÉ (objet local) | FR-87 |
| Réécrire (3 accroches) | SIMULÉ | FR-88 |
| Éditer à la main, replanifier, supprimer | SIMULÉ | FR-87 |
| Valider et programmer | SIMULÉ (rien publié) | FR-89 ; publication automatique : bientôt (WhatsApp février 2027, autres réseaux après) |
| Annuler la dernière action | SIMULÉ | FR-87 (historique) |
| Envoyer la réponse | SIMULÉ (aucun message ne part) | FR-91 ; envoi réel : bientôt (WhatsApp février 2027) |
| Modifier la réponse | SIMULÉ (sans éditeur) | FR-91 |
| Créer le lead | SIMULÉ (aucun lead) | FR-92 |
| Réponse automatique | MORT | bientôt (après février 2027) |
| Connecter un compte (Instagram) | MORT | bientôt (après février 2027) |
| Réception automatique des messages | n'existe pas | bientôt (après février 2027) |

**Notes.**
- Ce module n'est pas ★. Il dépend de comptes et d'API tiers qui ne sont pas branchés. La règle du PO s'applique : aucun bouton qui simule.
- **Question ouverte.** Le PO a-t-il les comptes WhatsApp Business, Facebook, TikTok et Instagram du client de démonstration ? Sans eux, aucun branchement n'est démontrable.
- **Question ouverte.** Le coût mensuel du studio (420 000 F en dur) est un exemple ; le vrai coût est à saisir par le client.
- Le marketing (campagnes, combos stock → promotion) est au PRD marketing (partie 3). Le circuit « combos stock » est le seul de la démo branché de bout en bout ; il est le modèle des circuits à états à généraliser.
- Les réponses sur WhatsApp touchent des données personnelles de clients : la conservation et le consentement des messages sont à fixer avec le client. [ASSUMPTION: les messages sont conservés 12 mois.]

---

### 5.7 Add-on Réseau Freelance (`freelance`, M42)

**Dans la démo.** Pas de page propre. Le rôle `FREELANCE` a six écrans : tableau de bord (« ma marge du jour vs coût société »), Mon activité, Mes commandes grossiste, Disponibilité (prix société = « votre coût »), Facturation (proformas) et Mon portefeuille.
- **Contradictions :** le bandeau du freelance dit « marge non visible par la société », alors que la carte de commande du DG affiche « Marge free. » (`CommandesView.tsx:78-80`). La marge du freelance est un pourcentage du prix société (12 à 22 %), pas un écart de grille.
- **N'existent pas :** grille de prix freelance, prix client du freelance (le champ `grille_client_personnalisee` existe, inutilisé), plancher grossiste (cité, non codé), simulateur de marge, blocage d'une proforma sous marge minimale (12 % : avertit, ne bloque pas). Le freelance ne peut pas créer une commande depuis `/commandes` ; il transmet un panier depuis la disponibilité.
- **Chiffres à ne pas reprendre :** la rémunération du freelance (`ca_jour × 22 + marge_jour × 22`, somme du CA société et de la marge) est incohérente.
- **Prix de l'add-on (grille tarifaire) :** forfait Grand / Moyen / Petit, plus un prix par freelance actif (+25 000 / +16 000 / +10 000 F par mois en abonnement). [Voir la fiche de l'offre en partie 1.]

**Ce que le module fait.** Il permet au distributeur de travailler avec des commerciaux indépendants. Le freelance achète à la société au prix de la grille société, qu'il ne peut pas modifier, et revend à ses propres détaillants au prix qu'il fixe. La société ne voit jamais le prix du freelance. Chaque freelance a un portefeuille isolé, ses créances sont séparées, et son plafond de crédit est propre. Le module gère aussi les commissions et les reversements. Il réalise UJ-2 (la tournée d'un freelance) et UJ-1 (la facture d'un freelance à la société).

**Objets.**
- **Freelance** : lien vers un commercial du module `reseau` de type `FREELANCE`, `actif` (compté pour la facturation de l'add-on), `grille_applicable`, `plafond_de_credit`, `marge_minimale_pct`, `date_activation`.
- **Grille société** : la grille de prix société du module `catalogue`. Non modifiable par un freelance.
- **Prix du freelance** : `freelance`, `article`, `prix_de_vente_ht`. Visible du freelance, de personne d'autre.
- **Portefeuille du freelance** : ses points de vente (module `pdv`, `portefeuille = freelance`).
- **Commande du freelance** : une Commande (5.1) au prix société, `client = freelance` pour la société.
- **Créance du freelance** : ce que le freelance doit à la société (Créance, partie 3).
- **Créance de son client** : ce qu'un détaillant doit au freelance. Visible du freelance seul.
- **Reversement** : `freelance`, `periode`, `montant_du_a_la_societe`, `montant_verse`, `statut` (`A_VERSER | VERSE | PARTIEL | EN_RETARD`).
- **Commission** : `freelance`, `periode`, `base`, `taux`, `montant`. [ASSUMPTION: voir FR-98.]

#### FR-93 : Double tarification : la grille société est intouchable

Un administrateur active un commercial en freelance et lui rattache la grille société. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le freelance achète au prix de la grille société. Aucun écran ni appel ne lui permet de le modifier : `GRILLE_SOCIETE_NON_MODIFIABLE`.
- Le prix de la grille société s'affiche au freelance sous le libellé « votre coût d'achat ».
- Le freelance fixe, pour chaque article, le prix auquel il revend à ses détaillants. Il saisit ce prix dans son écran ; c'est le « prix freelance ». Un article sans prix freelance n'a pas de marge calculée.
- Le freelance voit sa marge par ligne : `prix freelance − prix société`, en valeur et en pourcentage.
- Un prix freelance inférieur au prix société déclenche un avertissement ; il est autorisé (promotion). Une marge sous le minimum (12 % par défaut) affiche un bandeau, sans blocage. [ASSUMPTION: avertir sans bloquer, comme la démo.]
- Les prix négociés propres à un client de la société ne s'appliquent jamais à un freelance.
- Sans le module `catalogue`, aucun prix n'est disponible : « non installé ».

#### FR-94 : Le prix du freelance n'est jamais visible de la société

Aucun rôle de la société ne lit le prix de vente, la marge ni les clients finaux d'un freelance. Réalise UJ-1.

**Conséquences (testables) :**
- Le prix de vente du freelance est stocké dans un espace lisible du freelance seul. Un appel au serveur par un autre rôle (DG compris) ne le retourne pas.
- Aucun écran de la société n'affiche « Marge free. ». La commande du freelance vue par le DG montre le montant société seulement. (Corrige l'écart de la démo.)
- Les exports, les rapports, les indicateurs d'équipe et les analyses IA ne contiennent pas le prix ni la marge d'un freelance. Test : chercher la marge d'un freelance dans toutes les réponses du serveur à un rôle de la société : zéro occurrence.
- Les indicateurs de la société sur un freelance se limitent à ce que la société sait : commandes passées à la société, montants au prix société, règlements, créance, points de vente rattachés.
- Le freelance voit les règles qui le concernent : sa grille société, ses prix, sa marge, ses créances.
- Le DG voit le classement des freelances sur les mesures de la société (CA société, règlement, nombre de points de vente), pas sur leur marge.

#### FR-95 : Portefeuille isolé

Chaque freelance a un portefeuille de points de vente que lui seul voit. Réalise UJ-2.

**Conséquences (testables) :**
- Un freelance ne lit que les points de vente de son portefeuille. L'adresse directe de la fiche d'un point de vente hors portefeuille est refusée : `PDV_HORS_PERIMETRE`.
- Un point de vente est dans un portefeuille de freelance ou dans un portefeuille de commercial salarié, jamais les deux. L'ajout d'un point de vente déjà au portefeuille d'un autre est signalé : `PDV_DEJA_AFFECTE`.
- Le portefeuille ne se transfère que par décision du responsable des ventes, avec motif. [ASSUMPTION: règle du module `pdv`.]
- Un freelance ne reçoit pas de passation d'ouverture sans que l'add-on soit actif (FR-83).
- Les points de vente d'un freelance ne sont pas dans les listes de conquête de la société, sauf accord. [ASSUMPTION: décision à trancher : la société sait-elle quels détaillants le freelance sert ?]
- Quand l'add-on est désactivé, le portefeuille est figé en lecture seule, et la société décide de sa reprise.

#### FR-96 : Commande à double flux

Un freelance passe une commande à la société à prix société, et vend à ses détaillants à son prix. Réalise UJ-2.

**Conséquences (testables) :**
- Un freelance crée une commande (5.1) dont le client, pour la société, est le freelance, au prix société. Le panier minimal est un paramètre (2 à 4 M XOF dans la démo, bandeau « paniers 2-4 M »).
- La société facture le freelance (FR-42) au prix société. Le freelance reçoit la facture et le bon de livraison.
- Le freelance a un écran « Mes commandes grossiste » avec la liste de ses commandes à la société. Il crée une commande depuis cet écran. (La démo l'interdisait.)
- La revente du freelance à ses détaillants se fait hors du système de la société : le freelance peut tenir ses ventes dans son propre espace (commandes, créances de ses clients). [ASSUMPTION: la facturation du freelance à ses détaillants est hors périmètre de février. Question ouverte au PO : qui facture le détaillant final ?]
- Les contrôles de la commande (stock, plafond de crédit du freelance, créance échue) s'appliquent à la commande du freelance (FR-33).
- Le stock réservé par un freelance est géré comme celui des autres commandes.

#### FR-97 : Créances séparées et plafond de crédit séparé

La dette du freelance envers la société et les dettes de ses détaillants envers lui sont deux choses distinctes. Réalise UJ-1.

**Conséquences (testables) :**
- Le plafond de crédit d'un freelance est le sien (champ du freelance), distinct du plafond de ses détaillants. Il se règle par le DAF.
- L'encours du freelance = restes dus des factures émises au freelance (FR-52). Il bloque ses commandes au-delà du plafond : `PLAFOND_CREDIT_DEPASSE`.
- Les créances que les détaillants du freelance lui doivent sont visibles du freelance seul. La société ne les voit pas ; elles n'entrent pas dans sa balance clients.
- La balance âgée de la société contient la créance du freelance et pas celles de ses détaillants.
- Un freelance en retard de règlement est bloqué comme tout client (FR-33).
- Le freelance règle ses factures par PI-SPI, FedaPay, espèces ou virement, comme tout client (module `paiement`).

#### FR-98 : Commissions et reversements

Le module calcule ce que le freelance doit reverser à la société et, si le distributeur le décide, sa commission. Réalise UJ-1.

**Conséquences (testables) :**
- Le reversement = ce que le freelance doit à la société au titre des factures du période, selon le prix société. Le module suit le montant dû, versé, restant, par période.
- Le freelance voit son état : à verser, versé, restant, en retard.
- Le règlement d'un reversement passe par un Encaissement du module `paiement` (FR-49) et réduit la Créance du freelance.
- **Commission :** le modèle économique de la démo est que le freelance gagne la différence entre son prix et le prix société ; il n'y a pas de commission payée par la société. La formule de rémunération de la démo (`ca_jour × 22 + marge_jour × 22`) est incohérente et n'est pas reprise.
- Si le distributeur veut verser une commission ou une prime à un freelance (par exemple un bonus sur objectif), le taux est un paramètre de l'organisation, appliqué au CA société du freelance. [ASSUMPTION: option désactivée par défaut ; décision à trancher avec le PO.]
- Un freelance ne voit pas la rémunération des autres. Le superviseur et le contrôleur de gestion ne voient pas les rémunérations individuelles.
- Les reversements et commissions s'exportent en CSV pour le DAF.

#### FR-99 : Classements séparés et activation de l'add-on

Les freelances sont classés à part des salariés, et l'add-on se compte par freelance actif. Réalise UJ-2.

**Conséquences (testables) :**
- Le classement des freelances est séparé de celui des salariés. Les indicateurs du poste freelance sont : marge nette dégagée (30), CA société (20), points de vente du portefeuille (15), respect de la grille de prix (25), nouveaux points de vente (10) (poids de la démo). Marge nette et respect de la grille de prix sont visibles du freelance seul ; la société voit les mesures qu'elle connaît (FR-94).
- Un administrateur active et désactive un freelance. Le nombre de freelances actifs est visible (il sert à la facturation de l'add-on : forfait plus prix par freelance actif).
- L'add-on est un module installable : sans lui, le type de commercial `FREELANCE` n'est pas proposé et les écrans freelance n'existent pas. Aucune donnée freelance n'est affichée « 0 » : elle affiche « non installé ».
- La désactivation d'un freelance ne supprime ni ses factures ni ses créances.
- Le jeu de démonstration contient 3 freelances sur 12 commerciaux, chacun avec un portefeuille de 25 à 60 points de vente, un plafond de crédit et des prix propres.
- Le respect de la grille de prix = part des lignes vendues au-dessus de la marge minimale (12 %). La mesure appartient au freelance.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Marge minimale du freelance | 12 % de marge | oui | `ProformaBuilder.tsx:22-23` |
| Majoration par défaut | 15 % | oui | idem |
| Panier minimal d'une commande de freelance | 2 à 4 M XOF (texte du bandeau) | oui | `CommandesView.tsx:138` |
| Marge freelance | `prix freelance − prix société` (en valeur et en %) | non | nouvelle (la démo la posait à 12-22 % du prix société) |
| Respect de la grille de prix | cible 95 % | oui | `kpi-postes-registry.ts:134-146` |
| Tarification de l'add-on | forfait + prix par freelance actif | à fixer | fiche de l'offre |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Disponibilité : prix société = « votre coût » | LECTURE | FR-93 |
| Ajouter au panier, transmettre | SIMULÉ | FR-96 |
| (absent) Fixer mon prix de vente | n'existe pas | FR-93 |
| (absent) Nouvelle commande depuis « Mes commandes grossiste » | n'existe pas | FR-96 |
| Marge visible par la société (« Marge free. ») | affichée | supprimée : FR-94 |
| (absent) Simulateur de marge | n'existe pas | bientôt (après février 2027) |
| (absent) Blocage d'une proforma sous marge minimale | n'existe pas | FR-93 (avertissement) ; blocage : décision à trancher |
| (absent) Suivi des reversements | n'existe pas | FR-98 |
| (absent) Activer ou désactiver un freelance | n'existe pas | FR-99 |

**Notes.**
- Ce module n'est pas ★ : le client de février n'est pas décrit comme ayant des freelances. Le jeu de démonstration en a trois, pour démontrer l'isolement.
- **Question ouverte (bloquante pour FR-96 et FR-98).** Qui facture le détaillant final : le freelance, ou la société pour son compte ? Le texte « le prix client est le vôtre » suggère que le freelance facture lui-même. Si la société facturait, elle verrait le prix du freelance, ce que la règle interdit.
- **Question ouverte.** Le freelance paie-t-il comptant la société ou a-t-il un crédit ? [ASSUMPTION: crédit avec plafond propre, comme tout client.]
- **Question ouverte.** Une commission est-elle versée par la société au freelance ? [ASSUMPTION: non.]
- **Décision à trancher.** La société voit-elle la liste des détaillants d'un freelance (nom, adresse) sans leurs prix ? [ASSUMPTION: non en v1.]
- **Écart de l'offre.** Les trois documents de l'offre ne concordent pas sur le prix de l'add-on et le nombre de modules ; l'arbitrage appartient à la partie 1.

---

## 6. Partie 3 — Les modules partagés avec la microfinance

Cette partie décrit huit modules que le distributeur partage avec la microfinance (IMF) et, pour certains, avec l'assurance : Terrain, Relances et recouvrement, Équipes, Comptabilité et finance, Marketing, Contrôle de gestion, Automatisations, Tableau de bord. Un neuvième, Support client, est hors de ce PRD (§6.9). Le front de démo `prospera-distributeur` définit le produit ; le PRD exige tout ce que la démo présente, mais en vrai (FR-1 : tout s'enregistre côté serveur et se relit par les autres rôles).

**Règle de la partie : une structure, plusieurs mots.** Comme le PRD réseau (« une agence est un lieu, une zone est un périmètre » : une structure, deux mots), chaque module est écrit UNE SEULE FOIS, neutre de verticale :
1. un **noyau commun** : objets, champs, statuts, règles, sans un mot propre à un métier ;
2. un **tableau de vocabulaire** par verticale (distributeur, IMF, assurance quand c'est pertinent) ;
3. ce qui est **propre au distributeur**, et seulement cela.

Le vocabulaire par verticale est une **donnée de paramétrage** de l'Organisation (libellés d'écran, de PDF, de message). Il n'est jamais une branche de code sur la verticale : aucun test « si distributeur » dans un module. Un test le vérifie : changer le tableau de vocabulaire d'une organisation change les libellés et rien d'autre.

**Comment les autres PRD y renvoient.** Les PRD microfinance et assurance, écrits ensuite, ne réécrivent pas ces modules. Ils citent le noyau (« Terrain, noyau, FR-100 à FR-110 »), remplissent leur colonne du tableau de vocabulaire, et ne décrivent que ce qui leur est propre (le prêt, l'échéance de prêt, le PAR réglementé, la police, le sinistre). Les colonnes IMF et assurance des tableaux ci-dessous sont des propositions de cadrage : elles ne viennent pas du code de la démo, qui ne contient aucune trace IMF. [ASSUMPTION: toute cellule IMF ou assurance est à confirmer par le PRD de sa verticale.]

**Règles communes reprises de la partie 1 (non répétées).** FR-1 (tout s'enregistre), FR-2 (bouton « bientôt »), FR-3 (enchaînements entre rôles), FR-4 et FR-5 (rôles, table d'accès), FR-6 (périmètres côté serveur), FR-7 (chaque rôle sa vue), FR-8 (données privées), FR-13 (garde-fous qui bloquent), FR-14 (alerte et décision à trancher), FR-15 (indicateurs calculés), FR-16 (provenance d'une prédiction), FR-17 (PDF réels), FR-18 (exports), FR-19 (modules installables). Les patrons de la partie 2 s'appliquent aussi : **emplacement déclaré vide** (un module dont on dépend n'est pas installé : la donnée affiche « non installé », jamais 0) et **jeu de démonstration** (« Grossiste du Golfe », jus et boissons, XOF, TVA 18 %).

**Renvois aux modules déjà codés.** Moyens de paiement : le module `paiement` porte PI-SPI et FedaPay, plus espèces et virement déclarés (voir son PRD, `../prd-paiement-service-2026-08-02/prd.md`, §6 sections C à G, et F pour les encaissements hors Prospera). Messages : le module `notification` porte WhatsApp, SMS et e-mail, le consentement et le désabonnement (voir son PRD, `../prd-notification-service-2026-08-02/prd.md`, §5 sections C à H). Les modules de cette partie les appellent ; ils ne les réécrivent pas.

**Un objet qui traverse la partie : la Créance.** Ce que le distributeur appelle facture impayée et l'IMF échéance de prêt en retard sont deux **Sources de créance** d'un même objet. Le choix d'unification est posé en 6.2 (FR-111) ; les modules 6.3, 6.4, 6.6 et 6.8 le lisent.

---

### 6.1 Terrain et application mobile (`terrain`, M12)

**Dans la démo.** Cinq écrans : `/mon-activite` (agenda du commercial), `/disponibilite` (disponibilité des produits et panier), `/tournees` (« Tournées & Cash », superviseur), `/commercial` (pilotage commercial terrain, DG) et la clôture de visite (`ClotureVisiteModal`).
- **SIMULÉ, persisté dans le navigateur (`localStorage`) :** « Y aller » (passe la visite à `EN_COURS` et ouvre Google Maps), « Clôturer » (passe à `FAITE`, enregistre résultat et montants), « Ajouter » au panier, « Transmettre la commande ». Rien ne remonte vers le superviseur, ni vers les commandes, ni vers l'entrepôt.
- **Constantes ou tirages déterministes :** espèces encaissées = 55 % du chiffre d'affaires du jour ; écart de caisse = tirage pseudo-aléatoire par nom ; « exécution en magasin » = 5 pourcentages écrits en dur, sans écran de saisie ; position des commerciaux et statut `ALERTE_GPS` dérivés du score de performance, pas d'un GPS ; badge « Temps réel » et badge « Mode offline OK » = chaînes statiques.
- **Branché (calcul local) :** ordre de tournée par priorité de motif, comparaison « ordre priorité » / « plus proche voisin » (haversine, 22 km/h, 12 min d'arrêt), lancement de la navigation multi-arrêts, contrôle de présence à 200 m (mais facultatif, la trace n'est qu'une chaîne dans le commentaire).
- **Fuites :** `/commercial` n'est pas filtré par périmètre (22 commerciaux pour un superviseur) ; la fiche d'un point de vente s'ouvre hors portefeuille par l'URL (corrigé par FR-6).
- Rôles : COMMERCIAL, FREELANCE, PROSPECTION (agenda, disponibilité, commande) ; SUPERVISEUR, DC, DG (tournées, carte).

**Noyau commun.** L'Agent de terrain est la personne qui va chez un Tiers, saisit ce qui s'y passe, et encaisse. Objets :
- **Visite** : `agent`, `tiers`, `date_prevue`, `heure_prevue`, `duree_prevue`, `ordre`, `motif`, `statut`, `demarree_a` (heure serveur et heure appareil), `cloturee_a`, `resultat`, `commande` (liée), `encaissements` (liés), `distance_au_tiers_m`, `sur_place` (booléen), `commentaire`, `motif_report`, `origine_hors_connexion`.
  - Statuts : `PLANIFIEE`, `EN_COURS`, `FAITE`, `REPORTEE`, `ANNULEE`. `REPORTEE` et `ANNULEE` portent un motif obligatoire.
  - Motifs (paramétrables, avec un rang de priorité) : relance d'impayé (0), réclamation (1), réassort (2), lancement de produit (3), fidélisation (4), prospection (5).
  - Résultats : commande, encaissement, promesse, sans suite, client absent.
- **Tournée** : l'ensemble ordonné des visites d'un agent pour un jour. `statut` (`NON_DEMARREE`, `EN_COURS`, `TERMINEE`), `planifie`, `realise`, `km_parcourus` (mesuré).
- **Remise d'espèces** : `agent`, `tournee`, `montant_declare_encaisse`, `montant_remis`, `date`, `destinataire`, `bordereau` (pièce jointe), `statut` (`CONFORME`, `ECART`, `NON_REMISE`, `RAPPROCHEE`).
- **Écart de caisse** : `montant_remis − espèces_encaissées` de la tournée. Négatif = manquant.
- **Relevé d'exécution** : par visite, une liste de critères cochés (paramétrables par organisation).
- **Position** : points GPS de l'agent pendant une tournée ouverte, avec son consentement affiché dans l'application.

Règles du noyau :
- L'ordre d'une tournée suit le rang de priorité du motif, puis la proximité. Le motif d'une visite se déduit de l'état du Tiers (créance en retard : relance ; ouverture récente : prospection ; client à risque : réclamation ou fidélisation ; sinon réassort), selon des règles paramétrables.
- Une seule visite `EN_COURS` par agent.
- Le **serveur est seul juge** : l'application propose, le serveur valide et date. Une commande saisie hors connexion revient « en attente de confirmation du stock » (FR-103).
- Un encaissement est toujours relié à une visite ou à une Tournée.

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Agent de terrain | commercial, freelance, chargé de prospection | agent de crédit, agent de collecte | agent général, courtier [ASSUMPTION] |
| Tiers | point de vente | membre, client, groupe solidaire | assuré, souscripteur [ASSUMPTION] |
| Lieu | magasin, dépôt | agence, guichet | agence [ASSUMPTION] |
| Zone | zone commerciale | zone de collecte | zone de gestion [ASSUMPTION] |
| Visite | visite commerciale | visite de collecte, rendez-vous d'octroi, suivi de groupe | visite client |
| Tournée | tournée de vente (PJP) | tournée de collecte | tournée |
| Motif « relance » | relance d'impayé | relance de remboursement | relance de prime |
| Résultat « commande » | commande | demande de crédit [ASSUMPTION] | proposition d'assurance [ASSUMPTION] |
| Résultat « encaissement » | encaissement client | remboursement ou épargne collectés | prime encaissée [ASSUMPTION] |
| Remise d'espèces | remise de caisse du commercial | versement de caisse de l'agent | reversement de primes [ASSUMPTION] |
| Écart de caisse | écart de caisse | écart de caisse | écart de caisse |

[ASSUMPTION: chez l'IMF, la collecte d'épargne et le remboursement de prêt sont deux sortes d'Encaissement portées par `paiement` ; le noyau Terrain ne les distingue pas.]

**Propre au distributeur.** Le freelance voit les prix société comme son « coût » et garde sa marge privée (FR-8, FR-39). La disponibilité des produits (FR-108) et la commande depuis la visite (FR-103) n'existent que là où les modules `stock` et `commande` sont installés. Chez l'IMF, ni stock ni catalogue : ces deux exigences sont « non installé ».

---

#### FR-100 : Plan de journée et tournée ordonnée

Un agent de terrain peut ouvrir son plan de journée : la liste ordonnée de ses visites, avec heure, durée, motif, adresse et statut. Un superviseur peut planifier ou déplacer une visite d'un agent de son périmètre. Réalise UJ-2.

**Conséquences (testables) :**
- Le plan est lu sur le serveur, pas fabriqué sur l'appareil. Kodjo, commercial à Bè, ne voit que les visites de son portefeuille ; un appel direct sur la visite d'un autre agent est refusé (FR-6).
- L'ordre suit le rang de priorité du motif (relance d'impayé avant réclamation, avant réassort, avant lancement, avant fidélisation, avant prospection). Un test avec une visite de chaque motif vérifie l'ordre.
- Une vue semaine (lundi au samedi) et un historique des 40 dernières visites faites sont disponibles.
- Une visite peut être `REPORTEE` ou `ANNULEE` avec un motif obligatoire (la démo avait les statuts sans action).
- Une visite planifiée depuis un Dossier de recouvrement (FR-121) apparaît dans la tournée de l'agent avec le motif « relance d'impayé ».
- La durée estimée d'une tournée = distance à vol d'oiseau ÷ 22 km/h + 12 min par arrêt (valeurs paramétrables). La comparaison « ordre priorité » / « plus proche voisin » est affichée avec le gain en km. Le calcul se fait sur l'appareil, donc hors connexion.
- L'optimisation avec routage routier réel est un bouton « bientôt ».

**Hors périmètre :** routage routier réel (« bientôt »), géocodage des adresses.

#### FR-101 : « Y aller » démarre la visite, pour de vrai

Un agent peut démarrer une visite planifiée. Réalise UJ-2.

**Conséquences (testables) :**
- « Y aller » passe la visite à `EN_COURS`, enregistre `demarree_a` (heure du serveur à la synchronisation, heure de l'appareil à l'action) et ouvre la navigation vers le Tiers.
- Une seconde visite ne peut pas passer à `EN_COURS` tant que la première n'est pas clôturée, reportée ou annulée : refus `VISITE_DEJA_EN_COURS`.
- Le superviseur voit la visite `EN_COURS` dans la minute qui suit la synchronisation (SM-4).
- Hors connexion, l'action est mise dans la file d'envoi (FR-109) et l'agent voit « à envoyer » sur la visite.

#### FR-102 : Clôturer une visite avec contrôle de présence

Un agent peut clôturer une visite en choisissant un résultat. Réalise UJ-2.

**Conséquences (testables) :**
- Les résultats sont : commande, encaissement, promesse, sans suite, client absent. « Sans suite » et « client absent » exigent un commentaire.
- À la clôture, l'application lit la position et calcule la distance au Tiers. Elle enregistre `distance_au_tiers_m` (nombre) et `sur_place` (vrai si ≤ 200 m, valeur paramétrable, FR-13). La démo écrivait une chaîne dans le commentaire.
- Si `sur_place` est faux, la clôture reste possible mais la visite est **signalée** : une Alerte (FR-14) arrive chez le superviseur. Si la position est absente (GPS refusé ou indisponible), la visite est signalée « position non relevée ».
- Un résultat « promesse » crée une Promesse sur la Créance concernée (FR-118). Un résultat « encaissement » ou « commande » exige les objets liés (FR-103, FR-104) ; les montants ne sont plus saisis librement.
- Le serveur recalcule `sur_place` depuis la position reçue. Il ne croit pas le booléen de l'appareil.
- Une visite clôturée deux fois (deux appareils, ou un renvoi) reste clôturée une seule fois : le second envoi est ignoré et tracé.

#### FR-103 : Commande depuis la visite

Un agent peut prendre une commande depuis une visite : le Tiers est choisi dans son portefeuille, la commande est liée à la visite. Réalise UJ-2.

**Conséquences (testables) :**
- La commande est créée par le module `commande` (FR-37) ; ce module n'en redéfinit ni les lignes ni les prix. Le champ « Point de vente » n'est plus un texte libre.
- Le plafond de crédit et le blocage de crédit (FR-119) sont contrôlés à l'ouverture de la commande, hors connexion avec la dernière valeur connue, puis revérifiés par le serveur. Un Tiers dont le crédit est bloqué : la commande est refusée `CREDIT_BLOQUE`.
- Hors connexion, la commande reçoit le statut `EN_ATTENTE_CONFIRMATION_STOCK`. Le serveur confirme, confirme partiellement ou refuse selon le stock réel. L'agent voit le sort de sa commande à la synchronisation.
- La commande porte l'identifiant unique généré sur le téléphone. Un renvoi ne crée pas une seconde commande.
- La commande figure dans le taux de conversion de la visite (FR-107).
- Si le module `commande` n'est pas installé, le résultat « commande » n'est pas proposé.

#### FR-104 : Encaisser en visite

Un agent peut enregistrer un encaissement en visite : espèces, Mobile Money ou virement. Réalise UJ-2.

**Conséquences (testables) :**
- L'encaissement est créé dans le module `paiement`, rattaché à une Créance (FR-111) et à la visite. Moyens : PI-SPI et FedaPay par lien de paiement (voir le PRD paiement, sections C et D), espèces et virement déclarés (section F).
- Un encaissement en espèces ou en virement est « déclaré » : il diminue le solde affiché mais reste distingué d'un encaissement confirmé, jusqu'à la remise d'espèces (FR-105) ou la confirmation d'un rôle habilité.
- Chaque encaissement saisi hors connexion porte une **clé d'idempotence générée sur le téléphone**. Deux envois de la même clé créent un seul encaissement. Test : couper le réseau, saisir un encaissement, rétablir, renvoyer deux fois : un encaissement.
- Un montant supérieur au reste dû est refusé (`PAIEMENT_SUPERIEUR_AU_RESTE_DU`, FR-49).
- Le champ « encaissé » du KPI de l'agent est la somme des encaissements liés à ses visites, pas des montants libres.

#### FR-105 : Remise d'espèces et écart de caisse réels

Un agent peut déclarer la remise de ses espèces ; un superviseur ou un comptable peut la rapprocher. Réalise UJ-3.

**Conséquences (testables) :**
- L'agent saisit le montant remis, la date, le destinataire, et joint le bordereau. Les espèces à remettre = somme des encaissements en espèces de sa tournée, lus dans `paiement`. Ce n'est plus 55 % du chiffre d'affaires.
- `écart = montant_remis − espèces_encaissées`. Un écart non nul crée une Alerte `ECART_DE_CAISSE` (sévérité critique si manquant) chez le superviseur du périmètre. Une tournée sans remise après `N` jours (paramétrable, défaut 1) crée une Alerte « non remis ».
- Le rapprochement par le superviseur ou le comptable passe la remise à `RAPPROCHEE` et valide les encaissements déclarés correspondants dans `paiement` (voir son PRD, FR-P33).
- L'écart n'est jamais tiré au hasard ni estimé : s'il n'y a pas de remise saisie, l'écran affiche « remise non saisie », pas 0.
- Une remise est visible du comptable (FR-136) et du superviseur de la zone, pas d'un autre périmètre.

**Hors périmètre :** la caisse de guichet (module Caisse, voir le PRD paiement §1.1, objet B).

#### FR-106 : Carte de l'équipe

Un superviseur, un responsable des ventes, un DC ou un DG peut voir la carte de son équipe : positions, visites du jour, tiers à visiter. Réalise UJ-3.

**Conséquences (testables) :**
- La carte est Google Maps. Une position affichée est la dernière position reçue d'un agent dont la tournée est ouverte, avec son heure. Au-delà de 30 minutes sans position (paramétrable), l'agent passe à « position ancienne », jamais « en tournée ».
- Le statut d'un agent (`EN_TOURNEE`, `BUREAU`, `PAUSE`, `HORS_LIGNE`) est dérivé de sa tournée et de sa dernière activité. L'alerte GPS vient d'écarts de position réels (visite clôturée hors zone, FR-102), jamais du score de performance.
- Le badge « Temps réel » n'apparaît que si une position date de moins de 5 minutes.
- Chaque rôle ne voit que son périmètre : un superviseur ne voit que ses agents (FR-6). Il n'y a plus de repli « tout le réseau » quand le périmètre est vide : la liste est vide.
- Le rejeu de la journée d'un agent est calculé depuis ses visites et positions enregistrées.
- Les agents sont informés dans l'application que leur position est partagée pendant leur tournée. [ASSUMPTION: consentement et durée de conservation à valider avec la réglementation de protection des données.]

#### FR-107 : Conversion visite → commande et indicateurs de tournée

Un superviseur peut lire, pour une tournée ou une équipe, des indicateurs calculés sur les visites enregistrées. Réalise UJ-3.

**Conséquences (testables) :**
- Visites planifiées, réalisées, avec commande ; couverture de la tournée = réalisées ÷ planifiées ; taux de conversion = commandes issues de visites ÷ visites faites. Cible paramétrable (50 % dans la démo).
- Un test crée trois visites faites dont une avec commande : taux de 33 %. Il en clôture une quatrième sans commande : taux de 25 %. L'indicateur bouge (FR-15, SM-5).
- Les kilomètres parcourus viennent des positions enregistrées. Sans positions : « non mesuré ».
- L'**exécution en magasin** est un relevé saisi à la visite (cases à cocher, critères paramétrables). Un critère qu'aucun agent n'a saisi affiche « non saisi », pas un pourcentage.
- Les agrégats de zone et de superviseur additionnent les mêmes visites : la carte et les KPI ne peuvent plus diverger. Un test compare les deux.

#### FR-108 : Disponibilité des produits sans exposer les quantités

Un agent de terrain peut consulter la disponibilité des produits avant de promettre. Réalise UJ-2.

**Conséquences (testables) :**
- Trois états seulement : `DISPONIBLE`, `LIMITE` (stock sous le seuil, quantité confirmée à la validation par l'entrepôt), `RUPTURE`. La quantité exacte n'est jamais envoyée à l'application d'un agent. Test : la réponse du serveur à un agent ne contient aucun nombre de stock.
- L'état se calcule sur l'entrepôt source du Tiers, pas sur la somme de tous les entrepôts.
- Le prix affiché est le prix société ; pour un freelance, il est libellé « votre coût » (FR-39). La marge du freelance n'est pas visible de la société (FR-8).
- L'écran indique l'âge de la dernière synchronisation du catalogue et des états de stock.
- Sans module `stock` installé : « non installé », pas « disponible ».

#### FR-109 : Application mobile hors connexion

L'application `prospera-terrain`, en Flutter, doit servir un agent sans réseau. Réalise UJ-2.

**Conséquences (testables) :**
- Hors connexion, l'agent consulte son plan, ses Tiers, le catalogue et les états de disponibilité, et crée des visites clôturées, des commandes et des encaissements. Ils sont écrits dans une base locale et placés dans une **file d'envoi**.
- La file d'envoi est ordonnée et reprend après coupure sans perte ni doublon. Test (SM-4) : journée complète en 3G coupée, 5 visites, 2 commandes, 3 encaissements ; au retour du réseau, tout arrive une fois, dans l'ordre.
- Chaque objet porte un identifiant généré sur le téléphone ; chaque encaissement une clé d'idempotence (FR-104).
- Chaque visite, commande et encaissement affiche son état de synchronisation : à envoyer, envoyé, confirmé, refusé (avec le motif du serveur).
- Conflits : le serveur est seul juge. Visite clôturée deux fois : une seule retenue. Commande sur un stock devenu nul : `EN_ATTENTE_CONFIRMATION_STOCK` puis refus motivé. Les heures du serveur font foi pour l'ordre ; l'heure de l'appareil est gardée à titre de trace.
- L'application est testée sur un Android d'entrée de gamme à 2 Go de mémoire, en 3G coupée. Elle démarre en moins de 5 s (NFR-7).
- Le badge « Mode hors connexion » n'apparaît que si l'application détecte réellement l'absence de réseau.

#### FR-110 : Appareil perdu, session sûre

Un administrateur ou un superviseur peut déconnecter à distance l'appareil d'un agent. Réalise UJ-2.

**Conséquences (testables) :**
- Le jeton de session est gardé dans le stockage sécurisé du téléphone, jamais dans une base lisible.
- Une déconnexion à distance révoque le jeton ; au prochain contact avec le serveur, l'application efface sa base locale. Les objets de la file d'envoi non partis sont signalés au superviseur comme « perdus avec l'appareil », à rapprocher. [ASSUMPTION: la politique exacte (effacement, délai de grâce hors connexion) est à fixer avec le PO.]
- Un appareil sans contact depuis `N` jours (paramétrable, défaut 14) demande une nouvelle authentification. [ASSUMPTION]
- Le compte d'un agent ne peut être ouvert que sur un appareil à la fois, sauf décision de l'administrateur. [ASSUMPTION]

**Règles de calcul reprises de la démo.**
- Ordre de tournée par priorité de motif ; motif choisi selon l'état du Tiers (FR-100).
- Itinéraire : haversine, 22 km/h, 12 min d'arrêt par Tiers, plus proche voisin (FR-100).
- Contrôle de présence : 200 m (FR-102).
- Taux de transformation = commandes ÷ visites faites ; couverture de tournée = réalisées ÷ planifiées ; cible de conversion 50 % (FR-107).
- Disponibilité : `RUPTURE` si stock ≤ 0, `LIMITE` si stock < seuil, sinon `DISPONIBLE` (FR-108).
- **Non reprises :** espèces = 55 % du CA, écart de caisse tiré au hasard, statut `ALERTE_GPS` dérivé du score, pourcentages d'exécution en magasin en dur, `km_parcourus` aléatoire, « offline OK » statique, objectif d'un point de vente = CA × 1,1.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Y aller | simulé (navigateur) | FR-101 |
| Clôturer (et « Vérifier ma position ») | simulé ; contrôle facultatif | FR-102 |
| Ajouter au panier / Transmettre la commande | simulé | FR-103 |
| Optimiser le trajet / Lancer l'itinéraire | branché (calcul local) | repris (FR-100) ; routage réel « bientôt » |
| Rejeu de la journée | branché (données simulées) | FR-106 |
| Reporter, Annuler la visite, Ajouter une visite | absents | FR-100 |
| Enregistrer une remise de caisse, Valider l'écart, Rappeler l'agent | absents | FR-105 |
| Compte-rendu vocal | absent (promis par la documentation) | « bientôt » (date à fixer par le PO ; proposition : 31/03/2027) |
| Appeler, Réaffecter des PDV, Planifier un coaching | absents | « bientôt » ; la planification d'un coaching est FR-125 |

**Notes.**
- [ASSUMPTION: Google Maps pour la carte de l'équipe et la navigation, comme sur le PRD réseau ; l'OpenStreetMap de la démo n'est pas repris.]
- [ASSUMPTION: la prospection par pointage GPS (recensement) vit dans le module `conquete-objectifs` (FR-76) ; elle utilise la même application.]
- Question : conservation des positions GPS (durée, finalité) à valider avec le PO avant la mise en production.
- Question : un agent d'IMF encaisse de l'épargne ; le module `paiement` a-t-il un moyen distinct pour la collecte d'épargne ? À poser au PRD microfinance.

---

### 6.2 Relances et recouvrement (`recouvrement`, M19)

**Dans la démo.** `/relances` (`RelancesView`, 688 lignes) : 8 KPI, 6 règles d'automatisation, carte des débiteurs, tournée de recouvrement (jusqu'à 9 débiteurs), kanban à 8 colonnes (Détection, Planifiée, Envoyée, Réponse client, Visite terrain, Accord paiement, Résolue, Contentieux), balance âgée à 4 tranches, fiche dossier. Le cockpit RECOUVREMENT (`DashboardRecouvrement`) porte la file du jour, la prévision et les promesses.
- **SIMULÉ :** « Envoyer relance » (journalise, rien n'est envoyé), « Enregistrer paiement » (journalise, ne diminue ni le reste dû ni la facture), « Promesse » (pas de rappel, pas de bascule en « rompue »), « Escalader » (un seul cran), « Bloquer crédit » (aucune conséquence sur les commandes). Journal dans `localStorage`.
- **MORT :** « Envoyer maintenant », « Enregistrer une promesse », « Modifier », « Reporter » du cockpit (aucun gestionnaire).
- **Quatre modèles de créance sans pont :** `Facture`, `CreanceComptable`, `Relance` (dossier lié à UNE facture) et `DossierRecouvrement` (calculé). **Deux échelles d'escalade :** blocage à J+30 dans `/relances`, à plus de 60 jours dans les automatisations ; visite à J+14 contre 16-30. **Deux balances âgées :** 4 tranches (J+0-15, 16-30, 31-60, 60+) dans `/relances` ; 5 tranches (non échu, 1-30, 31-60, 61-90, plus de 90) dans un composant orphelin, `BalanceAgeeClientPanel`.
- Les transitions du kanban ne sont pas pilotées par les actions : le journal et le statut sont indépendants.
- Constantes : capacité de 12 dossiers par jour, objectif d'encaissement du mois 40 M, promesses du cockpit écrites en dur. « DSO » = retard moyen pondéré, pas un DSO.
- Rôles : DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, DAF, RECOUVREMENT.

**Noyau commun.** Ce qu'un Tiers doit à l'Organisation s'appelle une **Créance**. Elle naît d'une **Source de créance** et se solde par des Encaissements. Le recouvrement travaille sur la Créance, jamais sur la facture ni sur l'échéance de prêt.

- **Créance** : `numero`, `tiers`, `source` (`type`, `reference`), `montant_origine`, `devise`, `date_ouverture`, `date_echeance`, `montant_regle`, `reste_du`, `statut`, `perimetre` (zone, agent).
  - Statuts : `OUVERTE`, `PARTIELLE`, `SOLDEE`, `ANNULEE`. `EN_RETARD` n'est pas un statut : c'est un calcul (échéance dépassée et reste dû > 0), comme pour la facture (FR-49). `jours_retard` est calculé à la date de lecture.
- **Source de créance** : un type enregistré par un module. Il fournit les champs de la Créance et se reconnaît par sa `reference`. Aujourd'hui : `FACTURE` (module `facturation`). Prévu : `ECHEANCE_DE_PRET` (module crédit de l'IMF), `PRIME` (assurance). Une Source n'est pas une branche de code du noyau : elle s'inscrit par un événement de créance du contrat de la partie 4 (par exemple `facturation.creance.changed@1`).
- **Dossier de recouvrement** : `numero`, `tiers`, `creances` (une ou plusieurs), `montant_en_jeu`, `statut`, `priorite` (`CRITIQUE`, `HAUTE`, `NORMALE`, `BASSE`), `probabilite` (5 à 98), `valeur_esperee`, `palier_courant`, `prochaine_action` (et sa date), `assigne_a`, `credit_bloque`, `journal`.
  - Statuts : `DETECTE`, `EN_RELANCE`, `REPONDU`, `VISITE_PLANIFIEE`, `PROMESSE_EN_COURS`, `RESOLU`, `CONTENTIEUX`. Ils sont **dérivés du journal**, pas saisis à côté.
- **Événement de dossier** (journal, jamais modifié, seulement complété) : `RELANCE`, `PAIEMENT`, `PROMESSE`, `PROMESSE_TENUE`, `PROMESSE_ROMPUE`, `ESCALADE`, `VISITE_PLANIFIEE`, `BLOCAGE_CREDIT`, `DEBLOCAGE_CREDIT`, `CLOTURE`. Chacun porte auteur, date, canal, montant, note.
- **Promesse** : `dossier`, `montant`, `date_promise`, `statut` (`EN_ATTENTE`, `TENUE`, `PARTIELLEMENT_TENUE`, `ROMPUE`), `canal_obtention`, `auteur`.
- **Palier d'escalade** : `delai_jours` (négatif = avant l'échéance), `canal` (`WHATSAPP`, `SMS`, `APPEL`, `VISITE`, `EMAIL`, `DIRECTION`), `mode` (`AUTO`, `A_VALIDER`), `gabarit_message`, `garde_fous`. L'**échelle** est la liste ordonnée des paliers d'une Organisation.
- **Tranche d'âge** : `libelle`, `min_jours`, `max_jours`.

**Choix d'unification (en `[ASSUMPTION]`, à arbitrer par le PO).**
1. **Qui porte la Créance ?** Le registre des Créances est tenu par le module `paiement`. Il porte déjà une « créance projetée » (référence externe, montant d'origine, échéance, libellé) et maintient le solde encaissé (voir son PRD, FR-P13, FR-P27, FR-P37). La Créance de ce PRD est cette créance projetée, enrichie de `tiers`, `source`, `perimetre`. La source l'ouvre (`facturation` à l'émission d'une facture) ; les Encaissements de `paiement` la soldent ; `recouvrement` ne fait que la lire et y accrocher un Dossier. [ASSUMPTION: raisons : (a) `paiement` est déjà codé et calcule déjà le solde ; (b) `facturation` a besoin du reste dû même sans `recouvrement` (FR-49) ; (c) `recouvrement` sans `paiement` ne peut rien solder. Conséquence : un amendement du PRD `paiement` pour ajouter `tiers`, `source` et `perimetre` à la créance projetée ; sans `paiement` installé, le reste dû est « non installé » (FR-49).]
2. **Une seule balance âgée** : 5 tranches, comme la partie 2 (FR-51). Celle de 4 tranches disparaît.
3. **Une seule échelle d'escalade** : paramétrable par Organisation (FR-114). Les deux échelles de la démo deviennent deux jeux de valeurs initiales ; l'échelle retenue par défaut est celle de FR-114.
4. **Un seul Dossier par Tiers** qui regroupe ses créances en retard (la démo en avait un par facture). Un Tiers a au plus un Dossier ouvert. [ASSUMPTION: un dossier par tiers évite de relancer trois fois le même client pour trois factures ; le dossier par créance reste possible en paramètre.]

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Tiers | point de vente, client | membre, client, groupe solidaire | assuré |
| Créance | facture impayée, solde de facture | échéance de prêt en retard | prime impayée [ASSUMPTION] |
| Source de créance | `FACTURE` | `ECHEANCE_DE_PRET` | `PRIME` [ASSUMPTION] |
| Balance âgée | balance âgée clients (non échu, 1-30, 31-60, 61-90, +90) | portefeuille à risque : PAR 1-30, 31-60, 61-90, +90 (sans « non échu ») | primes impayées par ancienneté [ASSUMPTION] |
| Dossier de recouvrement | dossier de relance | dossier d'impayé | dossier de relance de prime |
| Promesse | promesse de paiement | promesse de remboursement | promesse de paiement |
| Blocage du crédit | blocage du crédit (plus de commande à crédit) | suspension de décaissement | suspension de nouvelle souscription [ASSUMPTION] |
| Escalade « direction » | alerte DG, mise en demeure | passage en contentieux, rééchelonnement | résiliation pour impayé [ASSUMPTION] |
| Plafond de crédit | plafond de crédit client | plafond d'octroi | sans objet |
| Agent de terrain | commercial | agent de collecte | agent |

[ASSUMPTION: chez l'IMF, le PAR et les pénalités de retard sont réglementés. Le noyau ne calcule ni pénalité ni intérêt de retard ni classement réglementaire : la Source `ECHEANCE_DE_PRET` les fournit comme champs de la Créance. Les tranches du PAR sont les tranches paramétrables du noyau.]

**Propre au distributeur.** La Source `FACTURE` et ses avoirs (FR-48) ; le blocage de crédit qui refuse une commande (FR-119) ; la probabilité de recouvrement calibrée sur le score du point de vente (FR-117) ; la mention « Mobile Money ou virement » des gabarits ; la visite du commercial assigné.

---

#### FR-111 : Une Créance, plusieurs Sources

Une Source de créance peut ouvrir une Créance ; les Encaissements la réduisent ; le recouvrement la lit. Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Une facture émise ouvre une Créance de source `FACTURE` (FR-49). Un avoir réduit son `montant_origine` ou son `reste_du` ; un Encaissement confirmé ou déclaré réduit `reste_du`.
- `reste_du = montant_origine − avoirs − encaissements`. Un test lie la même Créance à la facture (FR-49), au Dossier (FR-113) et à la balance (FR-112) : un encaissement de 200 000 sur 507 400 donne 307 400 partout, au même instant.
- Une Créance garde la clé de sa Source. Un Tiers peut avoir des Créances de Sources différentes ; la balance âgée les additionne.
- Un module Source non installé n'ouvre aucune Créance. Il n'y a pas de Créance « fantôme ».
- Les factures reprises de Sage (FR-58) ouvrent une Créance avec leur échéance d'origine.
- Sans le module `paiement`, `montant_regle` et `reste_du` affichent « non installé » (emplacement déclaré vide).
- Le périmètre s'applique par le serveur : un commercial ne lit que les Créances de ses Tiers (FR-6).

**Hors périmètre :** pénalités et intérêts de retard (portés par la Source), écritures comptables (6.4).

#### FR-112 : Balance âgée unique

Un DG, un DAF, un comptable, un responsable du recouvrement ou un commercial (pour son portefeuille) peut lire la balance âgée des Créances. Réalise UJ-1, UJ-4.

**Conséquences (testables) :**
- Tranches par défaut, paramétrables par Organisation : non échu, 1 à 30 jours, 31 à 60 jours, 61 à 90 jours, plus de 90 jours. L'âge se calcule depuis l'échéance (FR-51). Une tranche vide s'affiche à 0, pas masquée.
- C'est la même balance que FR-51 et FR-50 : leur total égale la somme des restes dus. Test automatique à la même date.
- Vues : par Tiers, par agent de terrain, par zone, par Source. Une date passée recalcule la balance sur les pièces et Encaissements datés avant.
- Un clic sur une tranche ouvre la liste des Créances ; un clic sur un Tiers ouvre son Dossier s'il en a un.
- La balance âgée de l'IMF est la même structure avec la tranche « non échu » masquée par paramétrage (PAR).
- Export CSV et PDF réels (FR-17, FR-18).

#### FR-113 : Dossier de recouvrement

Un responsable du recouvrement peut ouvrir, suivre et clôturer le Dossier d'un Tiers. Réalise UJ-4.

**Conséquences (testables) :**
- Un Dossier s'ouvre tout seul quand une Créance d'un Tiers dépasse le premier palier de l'échelle (FR-114), ou à la main par le responsable. Un Tiers a au plus un Dossier ouvert ; ses nouvelles Créances en retard s'y ajoutent.
- Le Dossier liste ses Créances, leur reste dû et leur retard. Son `montant_en_jeu` est la somme des restes dus.
- Le statut est dérivé du journal : envoyer une relance passe à `EN_RELANCE`, enregistrer une promesse à `PROMESSE_EN_COURS`, planifier une visite à `VISITE_PLANIFIEE`, solder toutes les Créances à `RESOLU`. Test : chaque action change la colonne du kanban (la démo les découplait).
- Chaque action du Dossier est un événement du journal avec auteur et heure. Le journal n'est pas modifiable. « Annuler la dernière action » devient un événement `ANNULATION` qui renvoie à l'événement annulé.
- Un Dossier se clôture quand le reste dû est nul ou sur décision motivée (abandon de créance : décision du DAF seul, FR-13). Un commercial ne peut pas clôturer un Dossier.
- Le Dossier est lisible par l'agent de terrain du Tiers (sa dernière relance, sa promesse) pour sa visite, sans la probabilité ni la provision.

#### FR-114 : Échelle d'escalade paramétrable

Un administrateur ou un DAF peut définir l'échelle d'escalade de l'Organisation. Réalise UJ-4.

**Conséquences (testables) :**
- L'échelle est une liste de paliers : délai (en jours avant ou après l'échéance), canal, mode (AUTO ou À VALIDER), gabarit de message, garde-fous. Aucun délai n'est écrit dans le code.
- Valeurs initiales proposées, remplaçables [ASSUMPTION : fusion des deux échelles de la démo] :

  | Palier | Délai | Canal | Mode | Garde-fou |
  |---|---|---|---|---|
  | Rappel préventif | J−3 | WhatsApp | AUTO | un seul rappel par Créance, jamais si déjà payée |
  | Relance douce | J+1 | WhatsApp, relevé joint | AUTO | ton neutre |
  | Relance ferme | J+7 | SMS, puis appel programmé | AUTO | 2 appels par jour au plus, promesse enregistrée avec montant et date |
  | Visite | J+15 | Visite de l'agent (FR-121) | À VALIDER | l'agent ne négocie jamais un abandon de créance |
  | Direction | J+30 | Mise en demeure et Alerte direction | À VALIDER | jamais envoyée sans validation humaine (acte à portée juridique) |
  | Blocage du crédit | plus de 60 jours ou encours au-dessus du plafond | automatique | AUTO | déblocage jamais automatique (FR-119) |

- L'ordre de l'échelle est vérifié : deux paliers ne peuvent pas avoir le même délai et le même canal.
- Une promesse non tenue fait remonter d'un palier (FR-118). Un paiement partiel suspend la relance, il ne l'arrête pas ; un paiement total l'arrête.
- Un palier AUTO ne part jamais en dehors de la fenêtre horaire de `notification` (voir son PRD, FR-N33) ni vers un Tiers désabonné pour ce type de message.
- [ASSUMPTION: le blocage est à plus de 60 jours, pas à J+30. À J+30 on alerte la direction. La démo avait les deux ; 30 jours bloquerait tout client qui paie avec un mois de retard, ce qui est la norme à 30 ou 45 jours de délai. Le PO peut ramener le blocage à J+30 par paramétrage sans changer le code.]

#### FR-115 : Une relance part vraiment

Un responsable du recouvrement ou un agent peut envoyer une relance depuis un Dossier ; une relance AUTO part seule. Réalise UJ-4.

**Conséquences (testables) :**
- « Envoyer relance » appelle le module `notification` (WhatsApp, SMS, e-mail) avec le gabarit du palier, rempli du nom du Tiers, du montant, des références de Créance et des moyens de paiement de l'Organisation. L'envoi, son accusé et son échec sont lus dans le journal de `notification` (voir son PRD, section F) et recopiés dans le journal du Dossier.
- Le message propose un lien de paiement (PI-SPI, FedaPay) quand l'Organisation en a ouvert, sinon les coordonnées de virement.
- Sans module `notification` installé, le bouton est « non installé » ; aucune relance n'est journalisée comme envoyée.
- Un envoi refusé (désabonné, canal absent, hors fenêtre) est journalisé avec le motif ; le Dossier ne passe pas à `EN_RELANCE`.
- Le ton monte avec le retard : avant l'échéance, jusqu'à 7 jours, jusqu'à 15, jusqu'à 30, au-delà de 30 (mise en demeure, mode À VALIDER). Le texte est un gabarit modifiable de l'Organisation.
- Une relance de recouvrement est un message transactionnel : la désinscription de la publicité ne l'éteint pas (voir PRD notification, FR-N50). [ASSUMPTION: à confirmer par le juriste.]

#### FR-116 : Enregistrer un paiement depuis le Dossier

Un responsable du recouvrement peut enregistrer un paiement reçu ; un agent peut en saisir un sur le terrain (FR-104). Réalise UJ-4.

**Conséquences (testables) :**
- Le paiement est un Encaissement du module `paiement` rattaché à la Créance. PI-SPI et FedaPay arrivent par rapprochement du lien ; espèces et virement se déclarent (voir PRD paiement, sections D et F). Le formulaire n'a plus un champ libre « référence Mobile Money ».
- L'Encaissement réduit `reste_du` de la Créance, le montant du Dossier et la facture, en une seule opération (la démo ne touchait rien).
- Un paiement supérieur au reste dû est refusé. Un paiement partiel passe la Créance à `PARTIELLE` et suspend la relance.
- Quand toutes les Créances sont soldées, le Dossier passe à `RESOLU`, les relances planifiées s'arrêtent, et un blocage de crédit lié à ce seul Dossier est proposé au déblocage (FR-119).
- L'Encaissement figure au lettrage du comptable (FR-132). Il n'y a rien à lettrer à la main.

#### FR-117 : Probabilité, prévision d'encaissement, provision

Un responsable du recouvrement ou un DAF peut lire la probabilité de recouvrement de chaque Dossier et la prévision d'encaissement. Réalise UJ-4.

**Conséquences (testables) :**
- La probabilité est une **règle** (pas une « IA ») : base selon le retard du plus ancien retard (95 à zéro jour ou moins, 82 de 1 à 30, 65 de 31 à 60, 45 de 61 à 90, 30 au-delà de 90), moins 0,4 fois le pourcentage de provision, plus 0,25 fois (score du Tiers moins 60), plus 10 si un paiement partiel a déjà eu lieu, bornée entre 5 et 98. Chaque Dossier affiche « règle de recouvrement, version, date de calcul » (FR-16).
- `valeur_esperee = reste_du × probabilité ÷ 100`. `perte_attendue = encours − valeur_esperee`.
- Prévision à 30 jours en quatre groupes : quasi certain (probabilité ≥ 80), probable (55 à 79), incertain (35 à 54), à provisionner (< 35). Un Dossier de probabilité < 40 est proposé en contentieux. [ASSUMPTION: les seuils 35 et 40 sont ceux de la démo, deux seuils proches ; à unifier avec le PO.]
- Le pourcentage de provision est saisi par le comptable ou le DAF (FR-129) ; sans valeur, la formule affiche « provision non saisie » et l'ajustement vaut 0.
- Le score du Tiers vient du module `pdv` (ou de son équivalent) ; sans score, l'ajustement vaut 0 et la fiche le dit.
- Le « DSO » est le vrai délai moyen d'encaissement = créances ouvertes ÷ chiffre d'affaires de la période × nombre de jours. Le retard moyen pondéré de la démo s'appelle « retard moyen pondéré ».
- L'objectif d'encaissement du mois est saisi par le DAF ; il n'est plus 40 M en dur.

#### FR-118 : Promesse de paiement

Un responsable du recouvrement ou un agent peut enregistrer une promesse sur un Dossier. Réalise UJ-4.

**Conséquences (testables) :**
- La promesse porte un montant (facultatif : à défaut, le reste dû), une date, le canal d'obtention, l'auteur. Mensah enregistre « Kiosque du Port paiera 300 000 le 20 » ; la promesse apparaît dans le Dossier et dans la visite de l'agent.
- Un rappel part la veille de la date (palier AUTO, FR-114).
- À la date promise, la promesse devient `TENUE` si l'Encaissement est reçu, `PARTIELLEMENT_TENUE` s'il est inférieur, `ROMPUE` sinon, sans intervention (voir PRD paiement, FR-P29). Une promesse rompue fait remonter d'un palier.
- Une première promesse rompue bénéficie d'un délai de grâce de 24 h (paramétrable). Au-delà de deux promesses rompues, un accord écrit est exigé (une pièce jointe) avant toute nouvelle promesse.
- La fiabilité du Tiers = promesses tenues ÷ promesses faites, affichée avec leur nombre. Sans promesse : « aucune promesse », pas 0 %.
- Un résultat de visite « promesse » (FR-102) crée la même promesse.

#### FR-119 : Le blocage du crédit bloque la commande

Un responsable du recouvrement, un DAF ou un DG peut bloquer ou débloquer le crédit d'un Tiers ; le blocage est appliqué par le serveur à toute commande. Réalise UJ-4.

**Conséquences (testables) :**
- Le blocage est automatique quand un Tiers a une Créance de plus de 60 jours ou un encours supérieur au plafond (FR-52), selon l'échelle (FR-114). Il peut être posé à la main avec un motif.
- Un Tiers au crédit bloqué voit sa commande refusée `CREDIT_BLOQUE` par le module `commande` (FR-33), quel que soit le canal : bureau, terrain, WhatsApp. Test : Mensah bloque le Tiers à 75 jours ; la commande de Kodjo est refusée au serveur, même en URL directe.
- Le déblocage n'est jamais automatique. Il demande un acompte (Encaissement) ou un échéancier signé (promesse avec pièce) et une décision d'un DAF ou d'un DG. Un responsable du recouvrement le propose ; il ne le décide pas. La décision suit FR-14.
- Chaque blocage et déblocage est un événement du journal avec auteur, motif, date. L'agent du Tiers et le superviseur sont notifiés.
- Une commande déjà validée avant le blocage n'est pas annulée ; sa livraison suit le blocage de la règle de `commande`. [ASSUMPTION: pas de coupure de livraison déjà préparée sans décision du DG.]
- Sans module `commande`, le blocage est une information sur le Tiers, affichée « sans effet : commande non installé ».

#### FR-120 : La file du jour, priorisée par ce qu'elle rapporte

Un responsable du recouvrement peut ouvrir sa file du jour : les Dossiers à traiter, triés par valeur espérée. Réalise UJ-4.

**Conséquences (testables) :**
- Le tri est par `valeur_esperee` décroissante. Mensah voit d'abord le Dossier dont `reste_du × probabilité` est le plus grand, pas le plus ancien.
- La file est bornée par une capacité par jour et par responsable (12 dossiers dans la démo, paramétrable). Les Dossiers au-delà sont dans « reporté à demain », avec le motif « capacité ».
- Chaque ligne propose : Envoyer maintenant, Enregistrer une promesse, Modifier le message, Reporter. Chaque bouton agit (FR-115, FR-118) ; « Reporter » enregistre une date et un motif.
- L'action recommandée est une règle : probabilité < 40 : contentieux ou échéancier ; retard > 60 jours : visite ; retard > 30 jours : appel puis échéancier ; paiement partiel obtenu : relancer sur le solde ; sinon : WhatsApp. Elle porte sa provenance (règle, version).
- Une Alerte (FR-14) arrive pour tout Dossier critique non traité depuis `N` jours.
- Le bloc « Cette nuit, sans vous » (relances parties seules, en attente de validation) compte des envois réels de `notification`, pas des cibles calculées (FR-163).

#### FR-121 : Planifier une visite de recouvrement

Un responsable du recouvrement ou un superviseur peut planifier une visite d'un agent chez un Tiers en retard. Réalise UJ-4.

**Conséquences (testables) :**
- La visite est créée par le module `terrain` (FR-100), motif « relance d'impayé », rang 0 de la tournée, reliée au Dossier. Elle apparaît dans le plan de l'agent à la prochaine synchronisation.
- La planification est un événement du journal du Dossier (`VISITE_PLANIFIEE`).
- Le choix de l'agent suit le portefeuille du Tiers ; un superviseur peut le changer dans son périmètre.
- La tournée de recouvrement (jusqu'à 9 plus gros débiteurs, démo) devient une proposition de tournée dans `terrain` (FR-100), jamais une liste hors du plan de l'agent.
- Le résultat de la visite (promesse, encaissement, absent) revient dans le Dossier sans ressaisie.
- Sans module `terrain` installé, le bouton est « non installé » ; une relance par visite reste possible à la main (événement `RELANCE` canal `VISITE`).

**Règles de calcul reprises de la démo.**
- Probabilité de recouvrement : base 95 / 82 / 65 / 45 / 30 selon le retard ; moins `provision × 0,4` ; plus `(score − 60) × 0,25` ; plus 10 si paiement partiel ; bornée 5-98 (FR-117).
- Valeur espérée = reste × probabilité ; priorité par valeur espérée décroissante (FR-120).
- Prévision : quasi certain ≥ 80, probable 55-79, incertain 35-54, perdu < 35 (FR-117).
- Capacité du jour : 12 dossiers (paramétrable, FR-120).
- Taux de réponse = {répondu, accord, visite, résolu} ÷ {envoyé, répondu, visite, accord, résolu, échec} ; recouvré du mois = somme des Encaissements sur Dossiers (calculés, FR-15).
- **Non reprises :** balance à 4 tranches ; blocage à J+30 ; promesses écrites en dur ; objectif de 40 M ; « DSO » = retard pondéré.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Envoyer relance (par canal) | simulé | FR-115 |
| Enregistrer paiement | simulé | FR-116 |
| Promesse | simulé | FR-118 |
| Escalader | simulé (un cran) | FR-114 |
| Bloquer / Débloquer crédit | simulé (aucun effet) | FR-119 |
| Annuler la dernière action | local | FR-113 (événement d'annulation) |
| Lancer la tournée | lien externe (branché) | FR-121 |
| Envoyer maintenant, Enregistrer une promesse, Modifier, Reporter (cockpit) | mort | FR-120 |

**Notes.**
- [ASSUMPTION: la Créance est tenue par `paiement` ; amendement du PRD `paiement` à écrire (FR-P13). Alternative écartée : un registre propre à `recouvrement` obligerait `facturation` à dépendre de lui pour afficher un reste dû.]
- [ASSUMPTION: relances à la date d'échéance, pas à la date d'émission, comme la balance âgée.]
- Question pour la partie 4 (contrat) : le manifeste `recouvrement` consomme `facturation.creance.changed@1` et `paiement.creance.soldee` ; vérifier que `paiement` accepte `tiers`, `source` et `perimetre` sur la créance projetée.
- Question : pénalités de retard du distributeur (non modélisées par la démo ; le PRD facturation les place sur la facture, FR-44).

---

### 6.3 Équipes et performance (`equipe`, M21)

**Dans la démo.** `/equipe` (`EquipeView`) : 8 KPI, trois vues (Classement et fiches, Tableau comparatif, Coaching et retours IA), fiche de commercial, matrice des scores de poste (`MatricePostesPanel`). Chaque cockpit porte aussi un `PerformancePostePanel` (score /100, 4 à 5 KPI, tendance 6 mois).
- **Constantes :** tous les KPI de poste (période figée « Juin 2026 ») ; « Objectif CA » 87 % en dur ; synthèse du DG et 5 décisions recommandées écrites à la main, avec des noms ; statut de performance écrit en dur pour 4 commerciaux.
- **Deux systèmes de statut :** le score de poste (EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60) et un statut de performance à 5 niveaux (TOP, PERFORMANT, NORMAL, SOUS_PERF, DEGRADE) tiré du « score IA ». Une formule de performance globale `(visites% + vs équipe% + recouvrement% + 2 × transformation%) ÷ 4` est sans justification.
- **Rémunération inventée :** commission 2,8 à 3,8 % tirée au hasard, base 280 à 420 K tirée au hasard, rémunération du freelance = CA société + marge (formule incohérente). Aucun barème réel.
- **Fuites de périmètre :** « Vue DG » affichée au superviseur, au responsable des ventes et au contrôleur de gestion ; repli sur toute l'équipe si le périmètre est vide ; rémunération individuelle visible du superviseur et du contrôleur.
- **MORT :** « Valider » et « Refuser » des demandes de remise ; aucune action « Planifier un coaching », « Fixer un objectif », « Valider une prime ».
- Rôles : DG, DC, RESP_VENTES, SUPERVISEUR, CONTROLE_GESTION.

**Noyau commun.**
- **KPI de poste** : un registre, par Rôle, de 4 à 5 indicateurs : `code`, `libelle`, `poids` (la somme des poids d'un poste vaut 100), `objectif`, `sens` (plus haut ou plus bas est meilleur), `source` (module et requête qui le calcule), `plafond_atteinte` (130 % par défaut).
- **Objectif** : `agent` (ou poste), `kpi`, `periode`, `valeur`, `fixe_par`. Fixé par le supérieur, jamais en dur dans le code.
- **Score de poste** : moyenne des taux d'atteinte pondérée par les poids, bornée à 100. Taux d'atteinte = valeur ÷ objectif, plafonné ; pour un KPI « plus bas est meilleur », objectif ÷ valeur.
- **Statut de score** : EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60 (seuils paramétrables).
- **Plan de coaching** : `agent`, `motif`, `actions`, `echeance`, `fait_par`, `statut` (`PLANIFIE`, `FAIT`, `ABANDONNE`).
- **Barème de rémunération** : paramètres de commission et de prime par type de contrat (privé, FR-126).
- **Demande de dérogation** : `demandeur`, `objet` (une remise ; chez l'IMF, une dérogation de crédit), `montant` ou `pourcentage`, `statut`. C'est une Décision à trancher (FR-14).

Règles du noyau : un KPI se calcule depuis ses données (FR-15) ; un score dont un KPI n'a pas de source installée est un **score partiel**, annoncé « calculé sur N KPI sur M » ; une agrégation se limite au Périmètre du lecteur (FR-6).

**KPI de poste (valeurs initiales de la démo, objectifs paramétrables).**
| Poste | KPI et poids |
|---|---|
| COMMERCIAL | visites par jour 25 ; commandes prises 20 ; CA généré 25 ; transformation visite → commande 20 (cible 60 %) ; encaissement terrain 10 (cible 80 %) |
| FREELANCE | marge nette dégagée 30 ; CA société 20 ; points de vente du portefeuille 15 ; respect de la grille de prix 25 (marge minimale 12 %) ; nouveaux points de vente 10 |
| SUPERVISEUR | couverture des visites 25 ; commerciaux au quota 25 ; points de vente à risque de départ 20 (inversé) ; délai de litige 15 (inversé) ; CA de zone 15 |
| RESP_VENTES | CA de zone sur quota 30 ; commandes terrain par jour 20 ; panier moyen 20 ; points de vente actifs 20 ; taux de rupture à la commande 10 (inversé) |
| DC | CA réseau 30 ; couverture des tournées 20 ; marge brute 25 ; nouveaux points de vente 15 ; conversion des prospects 10 |
| PROSPECTION | survie à M+3 30 ; recensé → 1re commande 25 ; impayé sur 1re commande 20 (inversé) ; coût d'acquisition 15 (inversé) ; ouvertures transférées 10 (parties 2, FR-81 à FR-83) |
| RESP_STOCK, GEST_ENTREPOT | voir partie 2 (modules `stock`, `entrepot`) |
| DAF | solde de trésorerie 25 ; marge nette 25 ; dette fournisseurs échue 25 (inversé) ; DSO 15 (inversé) ; écart budget / réel 10 (inversé) |
| COMPTABLE | écritures saisies par jour 20 ; taux de rapprochement 25 ; suspens ouverts 25 (inversé) ; délai de clôture 15 (inversé) ; factures traitées par jour 15 |
| CONTROLE_GESTION | lignes de budget sous contrôle 25 ; écarts critiques ouverts 25 (inversé) ; précision de la prévision 20 ; délai du rapport au comité 15 (inversé) ; écart budget / réel 15 (inversé) |
| MARKETING | ROI des campagnes 30 ; points de vente touchés 20 ; conversion des promotions 20 ; coût par point de vente activé 15 (inversé) ; CA généré par combos 15 |
| RECOUVREMENT | montant encaissé 30 ; taux d'encaissement 25 ; DSO 20 (inversé) ; relances abouties 15 ; créances de plus de 60 jours 10 (inversé) |

Le DG n'a pas de KPI de poste ; il lit la matrice de tous les postes (FR-124).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Agent de terrain salarié | commercial salarié | agent de crédit salarié | agent salarié [ASSUMPTION] |
| Agent de terrain indépendant | commercial freelance (marge propre) | agent indépendant, démarcheur commissionné | courtier, apporteur [ASSUMPTION] |
| Demande de dérogation | demande de remise | demande de dérogation de crédit | dérogation de souscription [ASSUMPTION] |
| Superviseur | superviseur de zone | chef d'agence | chef d'agence |
| Zone | zone commerciale | agence | agence |
| KPI « conversion » | visite → commande | visite → décaissement [ASSUMPTION] | visite → proposition |
| KPI « recouvrement » | taux de recouvrement | PAR, taux de remboursement | taux d'encaissement des primes |
| Rémunération | commission, prime d'objectif | commission, prime de performance | commission |

**Propre au distributeur.** Le respect de la grille de prix et la marge nette du freelance (donnée privée, FR-8, FR-39) ; la remise de ligne ou globale à valider (FR-127) ; le quota par zone et le mix produits (partie 2, FR-76 et suivants).

---

#### FR-122 : Les KPI de poste se calculent

Un rôle peut lire ses KPI de poste, calculés depuis les données de ses modules. Réalise UJ-3.

**Conséquences (testables) :**
- Chaque KPI du tableau ci-dessus est calculé par une requête sur le module source. Aucune valeur n'est écrite dans le code (FR-15). Test (SM-5) : clôturer une visite avec commande change « commandes prises » et « transformation » de Kodjo.
- Les objectifs sont des **Objectifs** saisis par le supérieur, par période. Sans Objectif fixé, le KPI affiche « objectif non fixé », pas 100 %.
- Chaque KPI affiche valeur, objectif, tendance sur 6 mois (calculée sur les périodes passées) et poids.
- La période est celle de la date de lecture, pas « Juin 2026 ».
- Un KPI dont le module source n'est pas installé affiche « non installé » ; le score devient partiel (FR-123).
- Le registre des KPI (codes, poids, objectifs par défaut) est un paramétrage de l'Organisation, modifiable par le DG ou l'administrateur ; les poids d'un poste doivent sommer à 100 : refus `POIDS_INVALIDES`.

#### FR-123 : Score sur 100 et statut

Un rôle peut lire son score de poste et son statut. Réalise UJ-3.

**Conséquences (testables) :**
- Score = moyenne pondérée des taux d'atteinte, plafonnés à 130 % chacun, le tout borné à 100. Statut : EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60.
- Test : KPI à 100 % d'atteinte partout : 100, EXCELLENT. Un KPI de poids 25 à 0 % : 75, BON.
- Un KPI « plus bas est meilleur » (délai de litige) : taux = objectif ÷ valeur. Valeur 0 : taux plafonné (pas de division par zéro).
- Le statut de performance à 5 niveaux (TOP, PERFORMANT, NORMAL, SOUS_PERF, DEGRADE) et la formule de performance globale de la démo disparaissent : un seul score, quatre statuts.
- Un score partiel est marqué « partiel » et ne s'affiche pas comme comparable à un score complet dans les classements.
- Un poste CRITIQUE crée une Alerte (FR-14) chez son supérieur.

#### FR-124 : Classement, matrice des postes, périmètre

Un superviseur, un responsable des ventes, un DC ou un DG peut classer et comparer les agents de son Périmètre. Réalise UJ-3.

**Conséquences (testables) :**
- Le classement trie par score décroissant dans le Périmètre du lecteur. Un superviseur voit ses agents ; un responsable des ventes les agents de ses zones ; le DC et le DG tout le réseau.
- Un superviseur sans agent rattaché voit une liste **vide**. Le repli « toute l'équipe » de la démo est supprimé (FR-6).
- Le DG voit la matrice des postes (un score par poste, triée par score). Le DC voit celle des postes commerciaux. Aucun rôle ne voit un autre poste que ceux de son Périmètre.
- Les vues, filtres (Tous, Top performers, salarié, freelance, à surveiller) sont lus sur le serveur.
- L'écran porte le titre de son rôle (« Mon équipe », « Mes zones », « Périmètre commercial »), jamais « Vue DG » (FR-7).
- Le tableau comparatif n'expose pas la rémunération aux rôles qui n'y ont pas droit (FR-126).

#### FR-125 : Coaching enregistré

Un superviseur ou un responsable des ventes peut identifier les agents à coacher et planifier un coaching. Réalise UJ-3.

**Conséquences (testables) :**
- La priorité de coaching est une **règle** à points, paramétrable. Valeurs initiales de la démo : +50 si la part de visites hors zone dépasse un seuil (à la place de « alerte GPS », FR-106) ; +35 si la couverture est inférieure à 65 %, sinon +18 si inférieure à 72 % ; +28 si le score est inférieur à 72 [ASSUMPTION : score de poste], sinon +12 si inférieur à 75 ; +22 si des impayés sont à relancer ; +14 si les visites sont sous 85 % de l'objectif. Un agent à 20 points ou plus est « à coacher » ; quatre au plus, triés par priorité.
- La règle affiche sa provenance : « règle de coaching, version, date » (FR-16). Le texte « coaching IA » de la démo, écrit à la main pour 4 noms, disparaît ; une phrase de coaching est composée des points de la règle qui ont joué.
- « Planifier un coaching » crée un Plan de coaching (agent, motif, date, actions) lisible de l'agent.
- Un plan fait ou abandonné reste dans l'historique de l'agent. Le superviseur voit ceux de son Périmètre.
- Appeler et Réaffecter des points de vente sont des boutons « bientôt » (date à fixer).

#### FR-126 : Salariés, freelances et rémunération privée

Un DG ou un rôle habilité peut voir la rémunération d'un agent ; un agent voit la sienne. Réalise UJ-3.

**Conséquences (testables) :**
- Seuls l'agent lui-même, le DG et le rôle explicitement habilité lisent une rémunération individuelle (FR-8). Un superviseur, un responsable des ventes et un contrôleur de gestion ne la lisent pas, ni dans les encadrés « Top performers », ni dans le tableau comparatif. Test : l'appel serveur d'un superviseur ne contient aucun champ de rémunération.
- La marge propre d'un freelance n'est visible ni du superviseur ni de la société (FR-8). La société ne voit que son CA société.
- La rémunération vient du barème (FR-128) appliqué aux données réelles ; elle n'est plus tirée au hasard. Sans barème saisi, elle affiche « barème non saisi ».
- La rémunération d'un freelance est sa marge nette (écart entre son prix de vente et le prix société, FR-39). Elle n'est pas CA + marge (formule de la démo écartée).
- Le type de contrat (salarié, freelance) est une donnée de l'agent, utilisée par les KPI et les libellés.

#### FR-127 : Valider ou refuser une demande de remise

Un superviseur, un responsable des ventes ou un DG peut valider ou refuser une demande de remise dans son Périmètre. Réalise UJ-3.

**Conséquences (testables) :**
- Une remise demandée au-dessus du seuil de l'agent crée une Demande de dérogation, qui est une Décision à trancher (FR-14) : `A_TRANCHER` puis `VALIDEE`, `REFUSEE` ou `REPORTEE`, avec auteur, date et motif obligatoire pour un refus.
- Seuils par niveau, paramétrables (FR-13) : [ASSUMPTION : l'agent jusqu'à son seuil ; le superviseur jusqu'à un seuil intermédiaire ; au-delà de 12 % la validation revient au DG, comme pour les combos de stock]. Le serveur refuse une validation par un rôle dont le seuil est inférieur : `SEUIL_VALIDATION_INSUFFISANT`.
- « Valider » libère la remise sur la commande (FR-33) ou la proforma ; « Refuser » la rejette et l'agent est informé. L'effet est visible dans la commande.
- Une remise d'un freelance qui ramène sa marge sous le minimum (12 %) est refusée par la règle de la grille de prix.
- Toute décision est dans le journal des décisions (FR-14).

#### FR-128 : Barème de commission

Un DG ou un rôle habilité peut saisir le barème de commission et de prime. Réalise UJ-3.

**Conséquences (testables) :**
- Le barème est une donnée : taux de commission par type de contrat, prime d'objectif, base. Il est privé (FR-8).
- Une commission est calculée sur le CA facturé et encaissé de l'agent sur la période. [ASSUMPTION: la commission porte sur l'encaissé, pas sur le facturé ; à confirmer par le PO.]
- Une modification du barème est tracée (auteur, date, ancienne valeur) et ne change pas les périodes closes.
- Sans barème, aucune commission n'est affichée et le tableau dit « barème non saisi ».

**Règles de calcul reprises de la démo.**
- Score de poste, plafond 130 %, inversion des KPI « plus bas est meilleur », bornage à 100 (FR-123).
- Statuts EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60 (FR-123).
- Poids des KPI par poste (tableau du noyau).
- Priorité de coaching à points (FR-125).
- Clients récurrents = Tiers actifs ou fidèles du portefeuille ; à risque = en dégradation ou créance de plus de 20 jours (lues dans `pdv`).
- **Non reprises :** performance globale `(…) ÷ 4` ; statuts TOP à DEGRADE ; commission et base tirées au hasard ; rémunération du freelance = CA + marge ; repli sur toute l'équipe ; « Objectif CA 87 % » ; synthèse écrite à la main.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Filtres, onglets, ouverture d'une fiche | branché (local) | FR-124 (lu sur le serveur) |
| Valider / Refuser (demandes de remise) | mort | FR-127 |
| Planifier un coaching | absent | FR-125 |
| Fixer un objectif | absent | FR-122 |
| Valider une prime | absent | FR-128 ; la validation d'une prime est « bientôt » (date à fixer) |
| Réaffecter des points de vente | absent | « bientôt » |

**Notes.**
- [ASSUMPTION: les KPI de poste des rôles propres au distributeur (stock, entrepôt, prospection) sont définis dans leurs modules de la partie 2 ; ce module les agrège.]
- Question : la validation d'une prime et le versement de rémunération relèvent-ils d'un module de paie hors de ce PRD ? Le produit ne paie personne ; il calcule.

---

### 6.4 Comptabilité et finance (`finance-transactions`, M22)

Ce module regroupe le poste du comptable (`/comptabilite`) et le pilotage financier du DAF et du DG (`/pilotage-financier`).

**Dans la démo.** `/comptabilite` aiguille le COMPTABLE vers un poste de travail et les autres rôles vers une vue analytique en lecture seule ; `/pilotage-financier` aiguille le DAF vers `PilotageDAFView` et le DG et le DC vers `ComptabiliteDGView`.
- **Aucune écriture n'est générée.** Les écritures SYSCOHADA (journaux VT, BQ, AC, OD, CA, CH) sont des données statiques ; l'étiquette « Facturation auto » est une chaîne. Les numéros de pièce ont trois formats pour un même objet (`FAC-8840`, `FAC-2026-8821`, `FAC-8841`). La TVA de plusieurs écritures vaut 15 % du TTC, pas 18 %.
- **SIMULÉ :** « Lettrer », « Mettre en suspens », cases de la clôture (journalisées sans effet), « Saisir la facture d'achat » (état local perdu au rechargement), « Payer / Partiel / Reporter » du run (le recalcul de trésorerie est réel, localement), « Accorder / Sous condition / Refuser » (aucun plafond modifié), « Valider / Reporter » des décisions du DG (aucune écriture passée).
- **MORT :** « Télédéclarer sur le portail OTR », « Geler le run et générer les ordres de virement », « Relancer » les pièces manquantes. Les ordres de virement n'existent pas comme objet.
- **Constantes :** trésorerie sur 7 jours (7 lignes statiques), encaissements certains à 7 jours 32,4 M, plancher 40 M, jours avant clôture 19, BFR et marges de canal sur un registre saisi, 3 comptes de trésorerie (aucun compte Mobile Money).
- Rôles : COMPTABLE (poste), DAF (pilotage), DG et DC (vue DG), RECOUVREMENT (analytique).

**Ce que le module fait, et ce qu'il ne fait pas.** Le produit **ne passe pas d'écritures au sens grand livre** à ce jour : pas de grand livre légal, pas de report à nouveau, pas de clôture légale, pas d'états financiers certifiés. Le module exige trois choses : (1) **générer** des écritures équilibrées à partir des pièces (factures, avoirs, encaissements, factures d'achat) ; (2) **rapprocher** (lettrage, suspens, remises d'espèces) et **piloter** la trésorerie ; (3) **alimenter** le module amont `balance` : il lui **soumet** une balance par compte et par période, au contrat de balance canonique, que `balance` projette en bilan (partie 2 du produit : `balance` et ses adaptateurs). Le grand livre légal reste chez le client (Sage, ou son expert-comptable) tant que le PO ne l'a pas décidé autrement. L'export vers Sage vient après (« bientôt », FR-131). [ASSUMPTION: le contrat de balance canonique n'a pas de devise ; la devise de l'organisation (XOF) est une convention déclarée par l'Organisation, pas par la balance.]

**Noyau commun.**
- **Écriture** : `numero`, `journal`, `date`, `piece` (référence de la pièce source), `source` (type + référence), `lignes` (`compte`, `libelle`, `debit`, `credit`), `statut` (`BROUILLON`, `ATTENTE_VALIDATION`, `VALIDEE`, `CONTREPASSEE`), `auteur`, `valide_par`. Une écriture est équilibrée (débit = crédit) ou refusée `ECRITURE_DESEQUILIBREE`. Une écriture validée ne se modifie pas : elle se contre-passe.
- **Référentiel comptable** : un paramètre de l'Organisation (plan de comptes, journaux, taux). Le plan est une donnée, pas du code.
- **Compte de trésorerie** : `type` (`BANQUE`, `CAISSE`, `MOBILE`), `libelle`, `solde`, `entrepot_ou_lieu`. Les comptes Mobile Money sont des comptes à part entière.
- **Suspens** : `libelle`, `montant`, `anciennete_jours`, `sévérité` (`CRITIQUE`, `MODERE`), `action`, `statut`.
- **Tâche de clôture** : `libelle`, `categorie` (`SAISIE`, `RAPPROCHEMENT`, `CUT_OFF`, `PROVISIONS`, `DECLARATIF`), `fait`, `fait_par`, `bloquee_par`.
- **Échéance déclarative** : `nature` (TVA, cotisations sociales, impôt sur les sociétés), `periode`, `date_limite`, `montants`, `statut` (`A_PREPARER`, `PRETE`, `DECLAREE`, `PAYEE`), `bloquants`.
- **Prévision de trésorerie** : par jour, `entrees`, `sorties`, `solde_fin`, `alerte`. Elle porte sa provenance (FR-16).
- **Demande de crédit** : `tiers`, `type` (`DEBLOCAGE_COMMANDE`, `RELEVEMENT_PLAFOND`), `montant`, `risque`, `statut` (Décision à trancher, FR-14).
- **Ligne de run** : `fournisseur`, `montant_du`, `echeance`, `recommandation` (`PAYER`, `PARTIEL`, `REPORTER`), `montant_arbitre`. Le **run** est un état de préparation. L'**ordre de paiement** appartient à `paiement` (voir son PRD, FR-P65 à FR-P69).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Référentiel comptable | SYSCOHADA révisé | plan comptable des SFD de l'UEMOA [ASSUMPTION] | CIMA, une amorce [ASSUMPTION] |
| Pièce source d'une écriture | facture, avoir, encaissement, facture d'achat | échéance de prêt payée, décaissement, collecte d'épargne [ASSUMPTION] | prime, sinistre payé [ASSUMPTION] |
| Compte client (411) | clients | membres, encours de prêts [ASSUMPTION] | assurés, primes à recevoir [ASSUMPTION] |
| Provision | provision clients douteux | provision pour créances en souffrance [ASSUMPTION] | provisions techniques (hors module) |
| Déclaration | TVA 18 %, CNSS, impôt sur les sociétés | états réglementaires de la BCEAO [ASSUMPTION] | états de la CIMA [ASSUMPTION] |
| Factures d'achat | factures fournisseurs (marchandises) | charges d'exploitation [ASSUMPTION] | charges de gestion [ASSUMPTION] |
| Demande de crédit (client) | décision de crédit client | sans objet : l'octroi de prêt a son propre module | sans objet |
| Run fournisseurs | paiement des fournisseurs de la semaine | paiement des fournisseurs et refinancement [ASSUMPTION] | paiement des prestataires |
| Plancher de trésorerie | plancher de trésorerie | ratio de liquidité [ASSUMPTION] | marge de solvabilité (hors module) |

**Propre au distributeur.** La TVA de 18 % sur ventes et achats ; le BFR par stock, créances et dettes (FR-138) ; la marge nette par canal de distribution (FR-139) ; les décisions de crédit client sur la marge à 12 mois (FR-140) ; le run fournisseurs avec escompte et pénalité (FR-141) ; les ristournes fournisseurs et les lignes bancaires, écrits en `[ASSUMPTION]` comme extension (aucun bouton ne les porte dans la démo : « Réclamer » est absent).

---

#### FR-129 : Écritures de vente et provision générées

Un comptable peut lire, valider ou contre-passer les écritures générées par les factures, les avoirs et les provisions. Réalise UJ-1.

**Conséquences (testables) :**
- À l'émission d'une facture (FR-42), le module génère une écriture au journal VT : débit du compte client (411) du TTC, crédit des ventes (701100) du HT, crédit de la TVA collectée (443100). TVA = HT × 18 % (FR-45). Facture de 507 400 : TTC 507 400, HT 430 000, TVA 77 400. Test : débit = crédit, au franc près.
- Un avoir (FR-48) génère l'écriture inverse, rattachée à la facture d'origine.
- Une écriture porte la référence de sa pièce : un seul format de numéro, celui de la facture (FR-43). Les trois formats de la démo disparaissent.
- Une provision (débit 657100 pertes sur créances, crédit 491200 provision clients douteux) est proposée à partir du pourcentage de provision du Dossier (FR-117). Elle est `ATTENTE_VALIDATION` jusqu'à une Décision à trancher du DAF ou du DG (FR-14). Valider la décision passe l'écriture à `VALIDEE` et change la balance ; la refuser l'abandonne.
- Une écriture générée automatiquement n'est pas modifiable à la main ; on la contre-passe et on émet la correcte.
- Sans module `facturation` installé : « non installé », aucune écriture de vente.

#### FR-130 : Écritures d'encaissement et d'achat générées

Un comptable peut lire les écritures générées par les encaissements et les factures d'achat. Réalise UJ-1.

**Conséquences (testables) :**
- Un Encaissement confirmé par `paiement` génère : débit banque (512100), caisse (531100) ou compte Mobile Money, crédit du compte client (411). Un encaissement déclaré non validé (FR-104) génère une écriture `BROUILLON`, pas `VALIDEE`.
- Une facture d'achat (FR-134) génère : débit des achats (601100) du HT, débit de la TVA déductible (445200), crédit du compte fournisseur (401100) du TTC.
- Le journal indique pour chaque écriture sa source (« facture », « encaissement », « achat », « saisie manuelle »). Une saisie manuelle exige un motif et passe par ATTENTE_VALIDATION.
- Les journaux sont VT, BQ, AC, OD, CA, CH ; le plan et les comptes sont ceux du référentiel de l'Organisation.
- Un compte de trésorerie `MOBILE` existe : un encaissement par PI-SPI ou FedaPay y est inscrit.

#### FR-131 : La balance soumise, et l'export qui vient après

Un comptable ou un DAF peut soumettre la balance d'une période à `balance`. Réalise UJ-5.

**Conséquences (testables) :**
- Une balance par compte et par période (débit, crédit, solde, sens) est calculée à partir des seules écritures `VALIDEE`. Elle est **soumise** à `balance` (adaptateur de la source « distribution » du hub multi-sources), qui la projette en bilan.
- Une soumission est horodatée, signée de son auteur, et n'est jamais remplacée sur place : une rectification est une nouvelle soumission qui renvoie à la précédente.
- La somme des soldes débiteurs égale la somme des soldes créditeurs, sinon la soumission est refusée `BALANCE_DESEQUILIBREE`. Le solde du 411 égale le total de la balance clients (FR-50) : écart affiché en rouge.
- Sans module `balance` installé, le bouton est « non installé ».
- Le module ne tient pas de grand livre légal et ne clôture pas l'exercice au sens légal. Il le dit à l'écran.
- L'export des factures et des paiements dans un format importable par Sage est un bouton « bientôt » (décision du PO du 12/11/2026 : après le démarrage). [ASSUMPTION: date proposée : mars 2027, à confirmer.]

#### FR-132 : Lettrage et suspens

Un comptable peut rapprocher un encaissement à une Créance, ou le mettre en suspens. Réalise UJ-1.

**Conséquences (testables) :**
- Les encaissements non affectés (référence brute illisible, paiement groupé, paiement partiel) sont proposés avec une confiance de 0 à 100. À 70 ou plus, la proposition est « automatique » (paramétrable) ; en dessous, elle est « manuelle ». Une proposition est toujours confirmée par un humain en première version.
- « Lettrer » affecte l'encaissement à la Créance dans `paiement` : `reste_du` baisse partout (facture, Dossier, balance) et les relances du Dossier s'arrêtent si le solde est nul (FR-116). La démo ne changeait aucun solde.
- Un paiement groupé pour deux factures est ventilé ; un paiement partiel reste identifié comme partiel ; un virement Mobile Money au nom de l'agent plutôt que du client est signalé comme encaissement terrain non déclaré.
- « Mettre en suspens » crée un Suspens avec son ancienneté et son action, visible du DAF. Un suspens critique crée une Alerte (FR-14).
- Les montants sont comparés avec la tolérance d'arrondi de l'Organisation (paramétrable).
- Sans module `facturation` : « non installé », aucun lettrage.

#### FR-133 : Déclaration de TVA préparée, télédéclaration « bientôt »

Un comptable peut préparer la déclaration de TVA de la période. Réalise UJ-1.

**Conséquences (testables) :**
- TVA à payer = TVA collectée − TVA déductible − crédit reporté. Les deux premières sont des sommes d'écritures validées (FR-129, FR-130). Test : un jeu de 5 factures et 2 achats donne la TVA attendue au franc près.
- La déclaration affiche ses **bloquants** calculés : factures d'achat non saisies pour des réceptions de la période, avoirs clients à émettre pour un écart de livraison. Chaque bloquant porte son impact en francs. Un bloquant non levé empêche le statut `PRETE`.
- Les statuts sont `A_PREPARER`, `PRETE`, `DECLAREE`, `PAYEE`. « Déclarée » et « Payée » sont posés à la main avec la référence du justificatif ; le produit n'en est pas témoin.
- Une Alerte (FR-14) arrive à 7 jours de la date limite si la déclaration n'est pas prête.
- « Télédéclarer sur le portail OTR » est un bouton « bientôt » : il relèvera du module `declarations` (partie 4). Il ne simule rien. [ASSUMPTION: date proposée : à fixer avec le PO ; non demandé pour février.]
- Les majorations de retard (TVA, cotisations sociales, impôt sur les sociétés) sont des paramètres de l'Organisation, pas du texte libre.

#### FR-134 : Factures d'achat

Un comptable peut saisir la facture d'achat d'une commande fournisseur reçue. Réalise UJ-6.

**Conséquences (testables) :**
- Les candidates sont les commandes fournisseur `RECUE`, `RECUE_PARTIELLE` ou `LITIGE` (partie 2, FR-62, FR-72). La saisie est enregistrée côté serveur : un rechargement ne la perd pas.
- HT = TTC ÷ 1,18 arrondi ; TVA = TTC − HT ; écriture générée (FR-130). La dette fournisseur (FR-67) est alimentée.
- Un écart entre le bon de livraison et la réception : seules les quantités reçues sont facturées ; l'écart passe en avoir fournisseur (avertissement affiché).
- Statut de paiement : `NON_DUE`, `A_PAYER`, `PARTIEL`, `PAYEE`, `ECHUE`. Échéance = date de réception + délai de paiement du fournisseur (FR-59).
- Une facture d'achat saisie deux fois pour la même commande est refusée `FACTURE_ACHAT_EXISTANTE`.
- Sans module `approvisionnement` installé : « non installé ».

#### FR-135 : Clôture de période

Un comptable peut suivre et fermer les tâches de clôture de la période. Réalise UJ-5.

**Conséquences (testables) :**
- La checklist est enregistrée : cocher une tâche l'enregistre avec son auteur et sa date ; la décocher aussi. Les 12 tâches de la démo (saisie, rapprochement, cut-off, provisions, déclaratif) sont des valeurs initiales de l'Organisation.
- `avancement = tâches faites ÷ tâches`. Une tâche bloquée par un tiers (une pièce manquante, FR-136) est isolée et nommée.
- Les « jours avant clôture » = date de clôture prévue − aujourd'hui ; ce n'est plus 19 en dur.
- Une tâche « Déclaration TVA » devient faite quand la déclaration passe à `PRETE` (FR-133), pas en cochant à la main.
- Une période est « arrêtée » par le DAF une fois toutes les tâches faites ; une période arrêtée n'accepte plus d'écriture sans contre-passation. [ASSUMPTION: ce n'est pas la clôture légale de l'exercice.]
- L'arrêt d'une période est le déclencheur de la soumission de la balance (FR-131).

#### FR-136 : Remises de caisse et pièces manquantes

Un comptable peut contrôler les remises d'espèces des tournées et réclamer les pièces manquantes. Réalise UJ-3.

**Conséquences (testables) :**
- Le bloc « Remises de caisse » liste les remises saisies par les agents (FR-105) : encaissé théorique, remis, écart, date, jours sans remise, statut. Il ne contient rien de simulé : sans remise saisie, la ligne dit « non saisie ».
- Une remise sans bordereau est signalée. Un montant non remis depuis plus de 5 jours (paramétrable) crée une Alerte à escalader au superviseur.
- Rapprocher une remise valide les encaissements déclarés correspondants (FR-105) et crée l'écriture de caisse.
- « Relancer » une pièce manquante envoie un message réel au détenteur par `notification`, et journalise l'ancienneté et le nombre de relances. Sans `notification` : « non installé ».
- Une pièce manquante qui bloque une tâche de clôture le dit (FR-135).

#### FR-137 : Trésorerie à 7 jours

Un DAF ou un DG peut lire la trésorerie des 7 prochains jours, recalculée depuis les données. Réalise UJ-5.

**Conséquences (testables) :**
- Solde de départ = somme des soldes des comptes de trésorerie (banque, caisses, Mobile Money). Chaque jour : entrées prévues − sorties prévues, solde de fin.
- Entrées prévues = somme, par jour, des valeurs espérées des Créances échues ou promises ce jour-là (règle de FR-117). Sorties prévues = échéances fournisseurs (FR-67), échéances fiscales et sociales (FR-133), lignes du run gelé (FR-141). Aucun chiffre n'est une constante.
- Modifier une échéance fournisseur change la trésorerie prévue du jour (SM-5).
- Un jour sous le plancher de trésorerie (40 M par défaut, FR-13) crée une Alerte ; un pic de sortie (par exemple 28,6 M le jour d'un run) est signalé avec sa cause.
- La prévision porte sa provenance : « règle de trésorerie, version, date de calcul » (FR-16). Aucune « IA » n'est annoncée.
- Un compte sans solde saisi affiche « solde non saisi » ; les entrées d'un module non installé affichent « non installé ».

#### FR-138 : BFR

Un DAF ou un DG peut lire le besoin en fonds de roulement. Réalise UJ-5.

**Conséquences (testables) :**
- BFR = valeur du stock + créances clients − dettes fournisseurs. Le stock vient de `stock` (valorisation, partie 2), les créances de la balance (FR-112), les dettes de FR-67. Sans `stock` : « non installé », pas 0.
- DIO = stock ÷ (achats du mois ÷ 30) ; DPO = dettes fournisseurs ÷ (achats du mois ÷ 30) ; marge de manœuvre = DPO − DIO ; BFR en jours = BFR ÷ achats par jour ; variation = BFR − BFR du mois précédent (lu dans la période arrêtée précédente, FR-135).
- Le DSO affiché est le vrai DSO (FR-117), pas le retard moyen pondéré.
- Chaque chiffre porte sa période et sa date de calcul. Changer une facture d'achat change la dette, donc le BFR (test).
- [ASSUMPTION: le DPO de la démo rapporte le solde total de dette aux achats du mois, sans lien avec les délais réels de paiement ; cette formule est reprise telle quelle tant que le PO n'en a pas retenu une autre.]

#### FR-139 : Marge nette par canal

Un DAF, un DG ou un contrôleur de gestion peut lire la marge nette par canal. Réalise UJ-5.

**Conséquences (testables) :**
- Marge nette = marge brute − remises − commissions − transport − coût du crédit client − pertes sur créances. Marge nette % = marge nette ÷ CA du canal. Un canal sous 2 % est « destructeur de valeur » (seuil paramétrable).
- Chaque terme vient d'une donnée : marge brute des factures (FR-53), remises des lignes, commissions du barème (FR-128), transport des coûts de livraison saisis, pertes des provisions et abandons validés (FR-129), coût du crédit client = encours × taux paramétré [ASSUMPTION].
- Un terme sans source installée est affiché « non installé » ; la marge nette n'est alors pas calculée et le dit.
- Le canal est un attribut du Tiers (type) et de la commande. Les quatre canaux de la démo (boutiques de proximité, dépôts et supérettes, grossistes, enseigne B2B) sont des valeurs initiales du paramétrage.
- Cette marge est calculée **une seule fois**, ici, et lue par le contrôle de gestion (FR-151). La seconde implémentation de la démo disparaît.
- Une Alerte (FR-14) est créée pour un canal destructeur.

#### FR-140 : Décision de crédit client

Un DAF peut accorder, accorder sous condition ou refuser une demande de crédit ; l'effet est réel. Réalise UJ-4.

**Conséquences (testables) :**
- Une Demande de crédit est de type `DEBLOCAGE_COMMANDE` ou `RELEVEMENT_PLAFOND`. Elle affiche : encours, plafond, dépassement, exposition après décision, CA et marge sur 12 mois, nombre de retards sur 12 mois, délai de paiement moyen, ancienneté, risque.
- Rendement du crédit = marge sur 12 mois ÷ exposition après décision. Signal rouge si rendement < 100 %, retards > 5, délai moyen > 45 jours (seuils paramétrables).
- Accorder un relèvement de plafond modifie le plafond du Tiers dans `pdv` (FR-52). Accorder un déblocage de commande lève le blocage de crédit de FR-119. Refuser n'a aucun effet et motive. « Sous condition » enregistre la condition (acompte, échéancier) et la déclenche au moment où elle est remplie.
- La demande suit le modèle de décision (FR-14) : `A_TRANCHER` puis `VALIDEE`, `REFUSEE` ou `REPORTEE`, avec journal.
- Le DAF n'accorde pas au-delà de son plafond de validation ; au-delà, c'est le DG (FR-13).
- La décision est visible du recouvrement et de l'agent du Tiers.

#### FR-141 : Run fournisseurs et ordres de paiement

Un DAF peut préparer le run de paiement des fournisseurs de la semaine ; un second rôle valide les ordres ; ils partent par `paiement`. Réalise UJ-6.

**Conséquences (testables) :**
- Chaque ligne affiche : fournisseur, montant dû, retard, échéance, conséquence du non-paiement, couverture de stock, escompte, pénalité, recommandation (`PAYER`, `PARTIEL`, `REPORTER`). Le DAF peut changer le choix et saisir un montant partiel (60 % par défaut, paramétrable).
- Escompte capté = montant payé × escompte %, si payé avant l'échéance. Pénalité encourue = (dû − payé) × pénalité %, si le choix n'est pas `PAYER`. Rupture risquée = ligne reportée dont la couverture est inférieure à 10 jours.
- Trésorerie projetée après run = solde actuel + entrées prévues sur 7 jours (FR-137) − décaissé. Sous le plancher de trésorerie (FR-13), « Geler le run et générer les ordres de virement » est refusé `PLANCHER_TRESORERIE_FRANCHI`.
- « Geler le run » crée, pour chaque ligne, un **ordre de paiement préparé** dans `paiement` (voir son PRD, FR-P65). Un autre rôle que le préparateur le valide (FR-P66) ; il part sous le raccordement de l'organisation (FR-P67). L'issue vient du fournisseur de paiement (FR-P68). Le run n'est jamais un fichier à porter à la banque.
- Prospera ne détient jamais les fonds (NFR-1 de `paiement`) : aucun solde, aucun compte payeur Money Vibes.
- Le run lit un état, jamais l'ordre : l'ordre appartient à `paiement`. Sans `paiement`, « Geler le run » est « non installé ».
- Une facture d'achat payée passe à `PAYEE` quand l'issue de l'ordre est « exécuté » ; l'écriture de décaissement est générée (FR-130).

**Règles de calcul reprises de la démo.**
- TVA à payer = collectée − déductible − crédit reporté (FR-133).
- HT d'un achat = TTC ÷ 1,18 arrondi (FR-134).
- BFR, DIO, DPO, marge de manœuvre (FR-138).
- Marge nette par canal et seuil de 2 % (FR-139).
- Escompte, pénalité, 60 % du partiel (FR-141).
- Rendement du crédit et seuils rouges (FR-140).
- Lettrage automatique à 70 de confiance (FR-132).
- **Non reprises :** TVA à 15 % du TTC ; encaissements certains 32,4 M ; plancher en dur ; trésorerie statique sur 7 jours ; jours avant clôture 19 ; trois formats de pièce ; « Valider » sans écriture.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Télédéclarer sur le portail OTR | mort | « bientôt » (module `declarations`) |
| Lettrer / Mettre en suspens | simulé | FR-132 |
| Cases de la clôture | simulé | FR-135 |
| Saisir la facture d'achat | simulé (non persisté) | FR-134 |
| Relancer (pièces manquantes) | mort | FR-136 |
| Valider / Reporter (décisions du DG) | simulé | FR-129 (provision), FR-14 |
| Payer / Partiel / Reporter (run) | simulé (recalcul local réel) | FR-141 |
| Geler le run et générer les ordres de virement | mort | FR-141 |
| Accorder / Sous condition / Refuser | simulé | FR-140 |
| Réclamer une ristourne (absent) | absent | « bientôt » |

**Notes.**
- [ASSUMPTION: les ristournes fournisseurs, les lignes bancaires et les covenants (statuts et calculs de la démo) sont lus mais non modifiables en première version ; aucun bouton d'action n'existe dans la démo.]
- Question : le module `finance-transactions` couvre-t-il un jour le grand livre ? Le manifeste (partie 4, A.11) dit non « à ce jour » ; l'export Sage et la décision sur le grand livre sont à cadrer avec le PO.
- Question : `finance-transactions` « service à créer » (M22) ; les exigences FR-129 à FR-135 supposent ce service ou une extension de `balance`. À trancher dans la partie 4.

---

### 6.5 Marketing et campagnes (`marketing`, M23)

**Dans la démo.** `/marketing` a deux vues : l'opérateur (MARKETING, DC) et le DG (contrôle, pas de création). 8 KPI, bloc « Combos écoulement stock », promotions fournisseurs, 4 onglets (Campagnes, Pipeline leads, Segmentation IA, Zones blanches), analyses IA.
- **Seul circuit branché de bout en bout de la démo : les combos de stock.** Une machine à états persistée dans le navigateur (`EN_ATTENTE_DG` → `VALIDEE` → `CAMPAGNE_CREEE`, plus `AUTO_DISPONIBLE`) : détection par règles sur le stock, validation du DG si la remise est de 12 % ou plus (ou sévérité critique, ou « promo choc »), campagne `PLANIFIEE` de 14 jours créée une seule fois (idempotent), budget = cibles × 5 500 F. Mais aucun envoi réel : la campagne reste à 0 contacté, 0 CA.
- **MORT :** « Lancer », « Modifier », « Ignorer » du cockpit marketing ; aucun passage `EN_COURS`, `PAUSE` ou `TERMINEE` ; aucune création de campagne à la main. Les suggestions de campagnes et les 5 décisions du DG sont en lecture seule.
- **Chiffres :** les statuts de campagne viennent d'un registre ; 4 KPI d'en-tête sont en dur ; deux « ROI » différents (marge générée ÷ coût pour les campagnes ; marge incrémentale moins coût, ÷ coût, pour le studio social) et un ROI de poste figé à 214 %.
- Rôles : DG, DC, MARKETING.

**Noyau commun.**
- **Campagne** : `nom`, `objectif`, `offre`, `produits` (ou, chez d'autres verticales, `offres`), `canal` (`WHATSAPP`, `SMS`, `TERRAIN`, `MIXTE`), `segment`, `zone`, `dates`, `budget_max`, `cout`, `statut` (`BROUILLON`, `PLANIFIEE`, `EN_COURS`, `PAUSE`, `TERMINEE`, `ANNULEE`), `source` (manuelle, combo de stock, promotion fournisseur), `responsable`, `entonnoir`.
- **Entonnoir** : cibles, contactés, délivrés, ouverts, répondus, convertis. Chaque nombre est compté sur des faits (envois réels, réponses, commandes).
- **Cible de campagne** : un Tiers retenu ou écarté, avec le motif d'écart.
- **Attribution** : le lien entre une commande (ou, ailleurs, un contrat) et une campagne.
- **Combo** (offre issue du stock) : voir le noyau « offre d'écoulement » ci-dessous.

Règles du noyau : un envoi de masse passe par `notification` (voir son PRD, section E : liste, préparation, échantillon, reprise, interruption, validation) ; le consentement et le désabonnement sont ceux de `notification` (section H) ; une Campagne n'envoie rien à un Tiers exclu (FR-148).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Tiers | point de vente | membre, client, groupe solidaire | assuré, prospect |
| Campagne | campagne promo, combo d'écoulement | campagne d'épargne, de crédit, de renouvellement de prêt | campagne de souscription, de renouvellement |
| Offre | prix promo, combo | produit d'épargne ou de crédit [ASSUMPTION] | produit d'assurance [ASSUMPTION] |
| Segment d'exclusion | client en retard, crédit bloqué | membre en retard de remboursement [ASSUMPTION] | assuré en impayé de prime [ASSUMPTION] |
| Zone blanche | zone non couverte | village non couvert | zone non couverte |
| Combo de stock | combo d'écoulement | sans objet | sans objet |

**Propre au distributeur.** Les **combos de stock** : tout ce qui vient du stock lent, du produit moteur, de la remise et de la validation du DG (FR-144 à FR-146). Les promotions fournisseurs (remise volume croisée avec le surstock) sont une variante (FR-146). Les zones blanches et le pipeline de leads relèvent de `conquete-objectifs` (partie 2, FR-76 à FR-78) ; le studio social est la partie 2 (module `studio-social`).

---

#### FR-142 : Créer et conduire une campagne

Un opérateur marketing peut créer, planifier, lancer, mettre en pause, arrêter ou modifier une campagne. Un DG ou un DC voit les campagnes de son Périmètre. Réalise UJ-5.

**Conséquences (testables) :**
- Une campagne se crée à la main (nom, offre, segment, canal, dates, budget) ou depuis un combo (FR-146). Elle est enregistrée côté serveur dès la création (FR-1).
- Les transitions sont : `BROUILLON` → `PLANIFIEE` → `EN_COURS` → `PAUSE` ou `TERMINEE` ; `ANNULEE` avant le premier envoi. Une transition interdite est refusée `TRANSITION_INTERDITE`.
- « Lancer » passe la campagne à `EN_COURS` et déclenche l'envoi (FR-147) ; « Modifier » change l'offre, le message ou le budget d'une campagne non terminée et garde l'historique de la version.
- Un budget dépassé (`cout` > `budget_max`) met la campagne en `PAUSE` et crée une Alerte (FR-14).
- La vue DG est en contrôle : le DG voit, valide les combos soumis (FR-145), met en pause ; il ne rédige pas la campagne.
- Un MARKETING ne voit pas les marges individuelles d'un freelance (FR-8).

#### FR-143 : ROI et indicateurs de campagne calculés

Un opérateur marketing, un DC ou un DG peut lire les indicateurs de chaque campagne. Réalise UJ-5.

**Conséquences (testables) :**
- Taux de contact = contactés ÷ cibles ; taux d'ouverture ; taux de réponse ; taux de conversion = convertis ÷ contactés ; coût par conversion = coût ÷ convertis ; budget restant = budget − coût. Tous calculés sur les faits (FR-15).
- **Un seul ROI** : (marge incrémentale attribuée − coût) ÷ coût. La marge incrémentale = marge des commandes attribuées (FR-149) moins la marge habituelle de ces mêmes Tiers sur la même durée. [ASSUMPTION: la référence « habituelle » = moyenne des 3 mois précédents ; à valider avec le PO.] Le ratio « marge générée ÷ coût » de la démo est affiché sous un autre nom : « retour brut ».
- **CA attribué ≠ CA créé.** L'écran affiche les deux : CA attribué (commandes liées à la campagne) et CA incrémental (attribué − habituel). Seul le second entre dans le ROI.
- Un indicateur sans fait (campagne planifiée, rien envoyé) affiche « 0 contacté » ou « non commencée », jamais un ROI.
- Les KPI d'en-tête du cockpit sont des sommes sur les campagnes du Périmètre : plus de « 47 prospects / 34 % / 3 campagnes / 8 zones » écrits en dur.
- Une conclusion de campagne (« à reconduire, à arrêter ») est une règle, avec sa provenance (FR-16).

#### FR-144 : Détecter un combo de stock

Le système peut proposer un combo d'écoulement à partir du stock lent. Un responsable stock, un marketing ou un DG voit les propositions. Réalise UJ-5.

**Conséquences (testables) :**
- La détection est une **règle**, pas une « IA » (FR-16). Elle lit les alertes de stock lent de `stock` (partie 2). Un produit est « lent » s'il est déficitaire, en chute, de rotation ≥ 16 jours, ou de couverture ≥ 22 jours avec demande nulle ; jamais si tous les sites sont en rupture. Un produit « moteur » n'est pas en rupture et a un engouement fort, une rotation ≤ 8 jours ou des sorties ≥ 3 000 par mois. Deux moteurs au plus par produit lent. Seuils paramétrables.
- Remise proposée sur le produit lent : 20 % si déficitaire, 15 % si en chute, 18 % si rotation ≥ 25 jours, 12 % si ≥ 16 jours, sinon 8 %. Type : `PROMO_CHOC` si déficitaire ou rotation ≥ 28 jours, `BUNDLE_ADOPTION` si deux moteurs, sinon `COMBO_MOTEUR`.
- Un combo affiche : produit lent, moteurs, stock à libérer = min(stock − seuil, max(40, 35 % des sorties mensuelles)), coût évité par mois, CA potentiel, marge du combo, nombre de cibles. Six combos au plus, triés par coût du stock lent. Chaque combo porte « règle de combo, version, date ».
- Sans module `stock` : « non installé », aucun combo. Avec `stock` mais sans ventes historiques : « données insuffisantes », pas un combo vide.

#### FR-145 : Valider un combo, au DG au-dessus du seuil

Un DG peut valider ou refuser un combo ; un marketing peut transmettre un combo sous le seuil. Réalise UJ-5.

**Conséquences (testables) :**
- Un combo demande la validation du DG si sa remise est supérieure ou égale à 12 % (garde-fou paramétrable, FR-13), ou si sa sévérité est critique, ou s'il est de type `PROMO_CHOC`. Sinon, il est transmis automatiquement au marketing (« auto sous le seuil »).
- La validation est une Décision à trancher (FR-14) : `A_TRANCHER` puis `VALIDEE`, `REFUSEE` ou `REPORTEE`, avec auteur, date, motif. Le journal contient « validé par » : DG ou AUTO.
- Un combo `A_TRANCHER` n'apparaît pas chez l'opérateur marketing : il voit « validation du DG requise ». Une transmission par un marketing d'un combo qui exige le DG est refusée `VALIDATION_DG_REQUISE` par le serveur.
- Les 5 décisions marketing du DG de la démo (lecture seule, écrites à la main) sont remplacées par les combos et campagnes réellement `A_TRANCHER`.

#### FR-146 : De la validation à la campagne

Un opérateur marketing peut créer la campagne d'un combo validé, la modifier, la lancer ou l'ignorer. Réalise UJ-5.

**Conséquences (testables) :**
- « Créer la campagne » est idempotent : appelée deux fois, elle retourne la même campagne. Elle crée une campagne `PLANIFIEE` de 14 jours (paramétrable), canal WhatsApp, budget = cibles × 5 500 F (paramétrable), avec le produit lent, les moteurs, les prix promo, un responsable affecté selon la zone. Recommandation affichée : ne pas appliquer la remise sans le panier moteur.
- « Ignorer » un combo l'écarte avec un motif ; il ne revient pas sans changement du stock. « Modifier » change le message, la remise (qui peut re-déclencher FR-145 si elle dépasse le seuil) ou la cible.
- L'ensemble du circuit **détection → validation du DG → marketing → campagne → envoi → commandes** est enregistré côté serveur et visible de chaque rôle (FR-3). Test de bout en bout : un combo détecté arrive en `A_TRANCHER` chez le DG, passe `VALIDEE`, le marketing crée la campagne, la lance, les messages partent, une commande est attribuée.
- Une promotion fournisseur (remise volume croisée avec un surstock > 45 jours) suit le même circuit : campagne d'écoulement de 21 jours, budget = cibles × 4 500 F (paramétrable).
- Sans `notification`, « Lancer » est « non installé » (FR-147).

#### FR-147 : L'envoi part pour de vrai

Lancer une campagne envoie réellement les messages aux cibles retenues, par le module `notification`. Réalise UJ-5.

**Conséquences (testables) :**
- À « Lancer », la liste des cibles retenues est transmise à `notification` comme liste d'envoi de masse (voir son PRD, FR-N28 à FR-N34) : échantillon, fenêtre horaire, plafond d'envois, validation éventuelle par un rôle habilité, reprise après interruption.
- Avant l'envoi, la campagne affiche : destinataires retenus, **écartés et pourquoi** (désabonné, canal absent, exclu pour impayé, plafond de messages atteint), coût estimé (voir FR-N31).
- L'accusé de réception et les réponses reviennent dans l'entonnoir (contactés, délivrés, répondus). Un compteur ne bouge jamais sans envoi.
- Une campagne interrompue garde l'état exact au moment de l'arrêt (FR-N32).
- Un désabonnement intervenu pendant l'envoi est respecté immédiatement (FR-N48).
- Sans `notification` installé : « non installé » ; la campagne reste `PLANIFIEE`.

#### FR-148 : Exclusions et plafond de messages

Le serveur exclut des campagnes les Tiers en défaut ou au crédit bloqué, et limite le nombre de messages par Tiers. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Un Tiers est exclu de tout envoi commercial s'il a une Créance de plus de 30 jours de retard, un crédit bloqué (FR-119) ou le statut « à risque ». Seuil paramétrable (`SEUIL_EXCLUSION_JOURS`).
- Le plafond est de **2 messages commerciaux par Tiers et par semaine**, toutes campagnes et règles d'automatisation confondues (paramétrable). Un message de recouvrement (transactionnel) n'y compte pas.
- Les Tiers exclus **restent visibles** dans la campagne avec leur motif (« retard de 47 jours », « plafond atteint »). Une exclusion qui bloque en silence est une exclusion qu'on finit par ne plus croire.
- Test : un Tiers au crédit bloqué (FR-119) est retiré de la cible d'une campagne lancée après le blocage, et réapparaît au déblocage.
- Sans module `recouvrement` ni `facturation` : l'exclusion pour impayé est « non installé » et l'écran le dit ; le plafond de messages s'applique toujours.

#### FR-149 : Relier les commandes aux campagnes

Une commande peut être attribuée à une campagne ; le marketing peut lire le CA attribué. Réalise UJ-5.

**Conséquences (testables) :**
- Une commande est attribuée à une campagne si son Tiers a été contacté (message délivré) et si elle contient un produit de l'offre, dans la durée de la campagne plus 7 jours (paramétrable). [ASSUMPTION: règle d'attribution à valider avec le PO.]
- Une commande n'est attribuée qu'à une campagne ; en cas de chevauchement, c'est la plus récente.
- Le lien est visible dans la commande (« issue de la campagne X ») et dans la campagne (liste des commandes attribuées).
- Le CA attribué et le CA incrémental alimentent le ROI (FR-143) et le KPI de poste du marketing (FR-122).
- Une commande annulée ou un avoir retire son montant du CA attribué.
- Sans module `commande` : « non installé ».

**Règles de calcul reprises de la démo.**
- Détection et remise du combo (FR-144) ; seuil de validation du DG à 12 % (FR-145) ; budget = cibles × 5 500 F, durée 14 jours (FR-146).
- Taux de contact, d'ouverture, de réponse, de conversion ; coût par conversion (FR-143).
- Plafond de 2 messages par client et par semaine ; exclusion à 30 jours de retard (FR-148).
- **Non reprises :** statuts de campagne issus d'un registre ; ROI figé à 214 % ; KPI d'en-tête écrits en dur ; « 4 500 F » et « 5 500 F » comme constantes (ils deviennent paramètres).

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Valider et transmettre au marketing (DG) | branché (navigateur) | FR-145 |
| Transmettre au marketing (sous le seuil) | branché (navigateur) | FR-145 |
| Créer la campagne / Voir la campagne | branché (navigateur) | FR-146 |
| Lancer | mort | FR-142, FR-147 |
| Modifier (le message) | mort | FR-146 |
| Ignorer | mort | FR-146 |
| Monter la campagne (promo fournisseur) | branché (navigateur) | FR-146 |
| Créer une campagne à la main | absent | FR-142 |

**Notes.**
- [ASSUMPTION: le studio réseaux sociaux (calendrier de publications, inbox unique) est le module `studio-social` de la partie 2. Ses publications réelles (Facebook, TikTok, Instagram) ne sont pas dans ce module.]
- Question : le « chatbot » WhatsApp de qualification des leads (règle `mkt-qualif-leads`) est-il un module ? Il n'existe pas dans le catalogue ; bouton « bientôt », sans date.
- Question : « ROI incrémental » exige un témoin ; sans témoin, le ROI affiché est le retour brut. Décision du PO attendue.

---

### 6.6 Contrôle de gestion (`controle-gestion`, M25)

**Dans la démo.** `/controle-gestion` (CONTROLE_GESTION seul) a 6 onglets : Cockpit, Budgets, Écarts, P&L analytique, Forecast, Rapports.
- **Tout est statique.** 19 lignes de budget pour juin 2026, une ligne par axe × centre × poste. Les **écarts ne sont pas calculés** depuis les budgets : ce sont des lignes saisies à part (risque d'incohérence). Le compte de résultat par axe est une table. Les 9 lignes de prévision glissante (3 mois × 3 scénarios) sont statiques ; « précision de la prévision » compare la prévision au budget, pas au réel.
- **Aucune saisie ou modification de budget**, aucune version, aucun « Figer le budget juillet ».
- **SIMULÉ :** « Envoyer le rapport » écrit un rapport dans le navigateur ; le DG et le DAF le voient dans leur courrier et le marquent lu. Ni PDF, ni e-mail, ni notification. « Export fichier » : CSV côté client ; PDF = `window.print()`.
- **Constantes :** marge cible 16,5 %, bande de ±3 %, période « Juin 2026 », version `BUD-2026-06-V1`.
- **Duplication :** la marge nette par canal est calculée deux fois (DAF et contrôle de gestion).
- Les causes et actions des écarts sont des textes écrits à la main, étiquetés « IA ».

**Noyau commun.**
- **Axe** : une dimension d'analyse paramétrable (zone, canal, famille de produits ; chez d'autres verticales, agence, produit).
- **Ligne de budget** : `axe`, `centre`, `poste` (`CA`, `MARGE`, `CHARGES`, `STOCK`), `periode`, `montant`, `version`.
- **Version de budget** : `code`, `periode`, `statut` (`BROUILLON`, `FIGEE`), `figee_par`. Une version figée ne se modifie plus ; une révision est une nouvelle version.
- **Écart** : `axe`, `centre`, `poste`, `budget`, `reel`, `atterrissage`, `ecart_pct`, `ecart_montant`, `severite` (`CRITIQUE`, `HAUTE`, `MODEREE`, `FAIBLE`), `cause`, `action_suggeree`, `confiance` (`AUTO`, `A_VALIDER`, `SUGGESTION`).
- **Prévision glissante** : par mois (3 mois), par scénario (`BASE`, `HAUT`, `BAS`), CA, marge, charges, trésorerie indicative.
- **Rapport de gestion** : `modele`, `titre`, `resume`, `ecarts`, `destinataires`, `statut` (`BROUILLON`, `ENVOYE`, `LU`), `envoye_par`, `lu_par`.

Règles du noyau : « le DAF arbitre, le contrôleur contrôle » : le contrôle de gestion mesure, alerte et propose ; il ne décide pas. Une proposition à arbitrer est une Décision à trancher adressée au DAF (FR-14).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Axe « lieu » | zone | agence | agence [ASSUMPTION] |
| Axe « canal » | canal de distribution | canal de collecte [ASSUMPTION] | réseau de distribution [ASSUMPTION] |
| Axe « famille » | famille de produits | produit financier [ASSUMPTION] | branche, produit [ASSUMPTION] |
| Poste `CA` | chiffre d'affaires | encours, produit net bancaire [ASSUMPTION] | primes émises [ASSUMPTION] |
| Poste `STOCK` | stock | sans objet | sans objet |
| Poste `MARGE` | marge brute | marge d'intérêt [ASSUMPTION] | marge technique (hors module) |

[ASSUMPTION: le manifeste classe le contrôle de gestion « distributeur ; microfinance à confirmer » ; la colonne IMF est une proposition.]

**Propre au distributeur.** Le poste `STOCK` et le BFR ; les coûts de transport et le coût du crédit client dans la marge nette (FR-139) ; les trois axes zone, canal, famille.

---

#### FR-150 : Budgets saisis et versionnés

Un contrôleur de gestion peut saisir, modifier et figer un budget par axe, centre et poste. Réalise UJ-5.

**Conséquences (testables) :**
- Une ligne de budget se saisit à la main ou s'importe d'un fichier (FR-18 pour le format). Elle est enregistrée côté serveur avec son auteur et sa version.
- « Figer le budget de juillet » passe la version à `FIGEE` : plus de modification possible, refus `BUDGET_FIGE`. Une révision crée une nouvelle version rattachée à la précédente.
- La somme des centres d'un axe peut être comparée à la ligne « Réseau » ; un écart de cohérence entre axes est signalé (pas forcé).
- La période est celle de la date de lecture, plus la liste des périodes passées. Plus de « Juin 2026 » figé.
- Seul le contrôleur de gestion saisit un budget ; le DG et le DAF le lisent.

#### FR-151 : Budget, réel, projection

Un contrôleur de gestion, un DAF ou un DG peut comparer budget, réel et projection par axe. Réalise UJ-5.

**Conséquences (testables) :**
- Le **réel** vient des modules : CA des factures (`facturation`), marge (FR-53, FR-139), charges des écritures (FR-129, FR-130), stock de `stock`. Un poste dont la source n'est pas installée affiche « non installé ».
- Écart % = (réel − budget) ÷ |budget| × 100, arrondi à 0,1 ; budget nul : 0 si réel nul, sinon 100 (règle de la démo). Une ligne est « sous contrôle » si |écart %| ≤ 3 (bande paramétrable). Test : budget 1 000, réel 1 030 : 3,0 %, sous contrôle ; réel 1 031 : 3,1 %, hors bande.
- **Atterrissage** = projection du réel du mois à la fin du mois (réel à date + rythme restant). Calculé, jamais saisi. Il porte sa provenance « règle d'atterrissage, version ».
- Les écarts sont **calculés depuis les lignes de budget**, pas saisis à part : un seul tableau, deux lectures. Test : modifier le réel (une facture) change l'écart.
- Les KPI du cockpit : CA budget et réel, marge budget et réel, part des lignes sous contrôle, écarts critiques ouverts. Aucun n'est une constante.
- Marge cible, bande, période sont des paramètres de l'Organisation (16,5 % et 3 % sont des valeurs initiales).

#### FR-152 : Écarts avec cause et action proposée

Un contrôleur de gestion peut lire les écarts classés par sévérité, avec une cause et une action. Réalise UJ-5.

**Conséquences (testables) :**
- La sévérité est une règle sur l'écart (seuils paramétrables par poste). Un écart critique crée une Alerte (FR-14).
- La cause est composée par une règle à partir des données (écart de volume, de prix, de mix, de coût). Elle affiche « règle de cause, version » et un niveau de confiance : `AUTO`, `A_VALIDER` ou `SUGGESTION`. Le texte écrit à la main de la démo, étiqueté « IA », disparaît.
- Une action suggérée peut devenir une Décision à trancher adressée au DAF (FR-14) : « le DAF arbitre, le contrôleur contrôle ». Le contrôleur la propose ; il ne l'applique pas.
- Un écart a un état (`OUVERT`, `EN_TRAITEMENT`, `CLOS`) et un responsable.
- Les écarts d'un poste dont la source est « non installé » n'existent pas ; ils ne valent pas 0.

#### FR-153 : Compte de résultat par axe

Un contrôleur de gestion, un DAF ou un DG peut lire le compte de résultat par zone, canal ou famille. Réalise UJ-5.

**Conséquences (testables) :**
- Par centre : produits, charges, marge brute, marge brute %, résultat, résultat %. Calculés sur les factures et les écritures, ventilés par axe.
- La somme des centres d'un axe égale le compte de résultat de l'entreprise (FR-129 à FR-131). Un écart est affiché en rouge avec l'axe en cause.
- Les charges non ventilables sont dans une ligne « non réparti », jamais cachées.
- Changer la zone d'un Tiers (FR-6, module `reseau`) déplace ses ventes dans le compte de résultat : test.

#### FR-154 : Prévision glissante sur 3 mois

Un contrôleur de gestion, un DAF ou un DG peut lire la prévision des 3 prochains mois, en trois scénarios. Réalise UJ-5.

**Conséquences (testables) :**
- La prévision est calculée par une **règle** : réel à date + tendance des 3 derniers mois (et saisonnalité si ≥ 12 mois d'historique), scénarios BASE, HAUT, BAS = écarts paramétrables autour de la base. Aucun modèle d'« IA » n'est affiché ; la provenance est « règle de prévision, version, date » (FR-16).
- Chaque mois affiche CA, marge, charges, trésorerie indicative et l'écart au budget du mois.
- La **précision de la prévision** = 1 − |prévu − réel| ÷ réel, mesurée à la fermeture du mois sur la prévision émise un mois plus tôt. Sans historique : « non mesurée » (la valeur de repli de 91 % de la démo est supprimée). La démo comparait la prévision au budget.
- Une prévision de trésorerie en dessous du plancher (FR-13) crée une Alerte.
- Moins de 3 mois d'historique : la prévision l'indique (« historique insuffisant ») et ne se présente pas comme fiable.

#### FR-155 : Rapports au DG et au DAF

Un contrôleur de gestion peut préparer un rapport et l'envoyer au DG et au DAF ; ils le lisent et le marquent lu. Réalise UJ-5.

**Conséquences (testables) :**
- Trois modèles de rapport (valeurs initiales : pack du comité de direction, alerte de marge d'un canal, flash d'une zone) ; le contrôleur choisit les écarts et au moins un destinataire (DG, DAF).
- « Envoyer le rapport » génère un **PDF réel** (FR-17) et envoie un message par `notification` (e-mail ou WhatsApp) avec un lien ; il crée un `RapportEnvoye` `ENVOYE` visible dans le courrier du DG et du DAF. Le destinataire le marque `LU` ; l'horodatage de lecture est enregistré.
- Le délai « rapport au comité » du KPI du contrôleur (FR-122) se mesure entre la fin de période et l'envoi.
- Sans `notification` : le rapport est `ENVOYE` dans le courrier interne et le message est « non installé ».
- L'export CSV contient tout le tableau du rapport, pas une ligne « Titre, Résumé, Destinataires » (démo).

#### FR-156 : Périmètre du contrôle de gestion

Le rôle CONTROLE_GESTION a une vue de lecture et de proposition ; elle respecte les données privées. Réalise UJ-5.

**Conséquences (testables) :**
- Le contrôleur lit les budgets, écarts, comptes de résultat, prévisions de toute l'Organisation. Il **ne lit pas** les rémunérations individuelles (FR-126) ni la marge d'un freelance (FR-8) : l'appel serveur n'en contient aucune.
- Le contrôleur n'a pas d'action de décision sur la trésorerie, le crédit client ni les paiements : ce sont des droits du DAF.
- L'écran `/facturation` ne lui présente pas de page vide : s'il n'a pas d'onglet, la route ne s'ouvre pas (FR-5).
- Aucun libellé « Vue DG » (FR-7).

**Règles de calcul reprises de la démo.**
- Écart % = (réel − budget) ÷ |budget| × 100 ; sous contrôle si |écart| ≤ 3 % (FR-151).
- Marge nette par canal : calculée une fois (FR-139).
- Part des lignes sous contrôle = lignes dans la bande ÷ toutes (FR-151).
- **Non reprises :** écarts saisis hors budgets ; précision de la prévision comparée au budget ; valeur de repli 91 % ; textes « IA » écrits à la main ; rapport sans PDF ; marge nette calculée deux fois.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Onglets, filtres d'axe, scénario | local | FR-151, FR-154 |
| Cartes de décision (clic) | local | FR-152 |
| Choix du modèle de rapport et des destinataires | local | FR-155 |
| Envoyer le rapport | simulé | FR-155 |
| Export fichier (CSV, PDF) | CSV branché ; PDF = impression | FR-17, FR-18 |
| Saisir un budget, créer une version, Figer le budget | absents | FR-150 |

**Notes.**
- [ASSUMPTION: l'axe « famille » exige que `catalogue` porte la famille de produits (partie 2) ; sans `catalogue`, l'axe est « non installé ».]
- Question : le contrôleur de gestion accède-t-il à des marges par client ? Aucune source ne le dit ; non accordé par défaut.

---

### 6.7 Automatisations (`automatisations`, M26)

**Dans la démo.** `/automatisations` (DG, MARKETING, RECOUVREMENT) montre 6 tuiles (actions automatiques, en attente de vous, retenues, valeur en jeu, temps gagné, équivalent temps plein), un encart « Trois niveaux de confiance, jamais un seul », et une carte par règle, dépliable (explication, garde-fous, quota, jusqu'à 6 cibles avec message prêt). Le moteur évalue les règles sur les registres à chaque affichage. 7 règles marketing et 9 règles de recouvrement.
- **Le « journal de la nuit » n'est pas sur cette page** : il est dans les cockpits (marketing, recouvrement, stock).
- **SIMULÉ :** interrupteur d'une règle (la page le relit, mais pas le badge du menu ni les cockpits) ; « Valider » une cible (badge « Validée », **aucun message ne part**) ; « Ignorer ». **MORT :** les cibles des règles AUTO (« Départ automatique demain 08:00 » est un texte : rien n'est planifié) ; « Lancer », « Modifier le message », « Ignorer » des cockpits.
- **Écart de cohérence :** le badge du menu (`AUTO_A_VALIDER`) se calcule sur les règles brutes ; valider une cible ne le fait pas baisser.
- **Constantes :** statistiques sur 30 jours (exécutions, taux de succès, impact) et gains de temps déclarés dans chaque règle.
- **Garde-fou transverse déjà codé :** exclusion des clients en défaut, plafond de 2 messages par client et par semaine ; les cibles exclues restent visibles avec leur motif.

**Noyau commun.**
- **Règle d'automatisation** : `nom`, `poste` (le rôle qui la possède), `declencheur`, `action`, `canal`, `mode` (`AUTO`, `A_VALIDER`, `SUGGESTION`), `actif`, `garde_fous`, `quota`, `module_proprietaire` (le module qui la définit : `recouvrement`, `marketing`, `stock`…).
  - `AUTO` : part sans intervention ; réservé aux actions réversibles et sans risque relationnel (rappel d'échéance, accusé de réception).
  - `A_VALIDER` : tout est prêt, un humain clique ; dès qu'il y a de l'argent, une remise ou la réputation en jeu.
  - `SUGGESTION` : le système signale ; l'humain décide et fait (baisser un plafond de crédit).
- **Cible** : ce sur quoi la règle agit : `regle`, `tiers`, `libelle`, `canal`, `message` (prêt à envoyer), `valeur`, `confiance` (0-100), `moment`, `statut` (`EN_ATTENTE`, `VALIDEE`, `REPORTEE`, `IGNOREE`, `EXECUTEE`, `RETENUE`), `retenue_par` (le garde-fou qui l'a écartée), `execution` (lien vers l'envoi réel).
- **Exécution** : un fait enregistré : règle, cible, heure, résultat, mode, auteur (`SYSTEME` ou une personne).
- **Garde-fou** : un paramètre qui bloque (FR-13), propre à une règle ou transverse.

Règles du noyau : les règles sont **définies par les modules métier** (le recouvrement définit ses paliers, FR-114 ; le marketing ses règles) ; le module `automatisations` est le moteur, la file d'arbitrage et le journal. Une règle n'est jamais une case décorative : elle produit des cibles réelles, enregistrées. Aucune règle ne contient de branche par verticale (une règle est une donnée).

**Vocabulaire par verticale.**
| Noyau | Distributeur | IMF | Assurance |
|---|---|---|---|
| Tiers | point de vente | membre, client | assuré |
| Règle de relance préventive | rappel d'échéance de facture | rappel d'échéance de remboursement | rappel de prime |
| Règle « client silencieux » | client sans commande depuis 30 jours | membre sans opération [ASSUMPTION] | assuré sans contact [ASSUMPTION] |
| Règle de suggestion de plafond | réduire le plafond de crédit | réduire le plafond d'octroi | sans objet |
| Règle de surstock | combo d'écoulement | sans objet | sans objet |

**Propre au distributeur.** Les règles de stock, de combo et de proforma qui expire ; le mode « SUGGESTION » appliqué au plafond de crédit client. Les règles du module `stock` (réappro, transfert) sont dans la partie 2.

---

#### FR-157 : La règle est un objet enregistré

Un DG, un marketing ou un responsable du recouvrement peut voir et paramétrer les règles de son poste. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Une règle est enregistrée côté serveur avec son déclencheur, son action, son canal, son mode, ses garde-fous et son quota. Les 7 règles marketing et les 9 règles de recouvrement de la démo sont des valeurs initiales fournies par leur module.
- Un DG voit les règles de tous les postes ; un marketing, celles du marketing ; un responsable du recouvrement, celles du recouvrement (FR-7). Ils modifient leurs règles dans leur Périmètre.
- Une règle porte une explication lisible : ce qu'elle fait, ce qu'elle refuse (ses garde-fous), son quota. Cette explication est composée de ses paramètres, pas écrite à part.
- Les statistiques de 30 jours (exécutions, taux de succès, impact) sont calculées sur les Exécutions réelles. Sans exécution : « aucune exécution », pas un taux.
- Une règle dont le module propriétaire n'est pas installé n'apparaît pas ; une règle dont le canal (`notification`) n'est pas installé apparaît « non installé ».

#### FR-158 : Trois modes, et un mode AUTO qui reste sûr

Une règle a un mode ; le serveur interdit AUTO pour les actions risquées. Réalise UJ-4.

**Conséquences (testables) :**
- `AUTO` ne s'applique qu'aux actions réversibles et sans risque relationnel : rappel d'échéance, accusé, relance douce. Le serveur refuse `AUTO` pour une règle dont l'action engage de l'argent, une remise, un blocage de crédit, une mise en demeure ou une publication : `MODE_AUTO_INTERDIT`.
- Une règle `A_VALIDER` prépare tout (cible, message) et attend un clic. Une règle `SUGGESTION` signale ; l'humain agit hors règle.
- Les trois modes sont toujours visibles : une carte dit « Automatique », « À valider », ou « Suggestion », jamais un mode unique.
- Un changement de mode d'une règle est un événement du journal (auteur, date, ancien mode).
- Le blocage de crédit automatique de FR-119 est une règle `AUTO` de blocage dont le **déblocage n'est jamais automatique** ; elle porte l'interrupteur `blocage-automatique-au-seuil` du manifeste.

#### FR-159 : Garde-fous transverses

Le serveur applique à toute règle les garde-fous de l'Organisation. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- **Exclusion** : un Tiers en défaut (retard au-delà du seuil, crédit bloqué, statut à risque) est exclu de tout envoi commercial (FR-148). Les cibles exclues restent visibles avec leur motif.
- **Quota** : 2 messages commerciaux par Tiers et par semaine, toutes règles et campagnes confondues (FR-148).
- **Fenêtre horaire** : pas d'envoi hors de la fenêtre autorisée par `notification` (voir son PRD, FR-N33).
- **Un garde-fou propre à la règle** (« un seul rappel par facture », « 2 appels par jour au plus ») est un paramètre vérifié par le serveur.
- Les garde-fous financiers de FR-13 (plafond de crédit, plancher de trésorerie, remise maximale) s'appliquent aux actions des règles comme aux actions humaines.
- Une cible retenue par un garde-fou est `RETENUE` avec le nom du garde-fou ; ce n'est jamais un échec silencieux.

#### FR-160 : File d'arbitrage : Valider, Reporter, Ignorer

Un rôle peut traiter les cibles d'une règle `A_VALIDER` ou `SUGGESTION` de son Périmètre. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Chaque cible `EN_ATTENTE` affiche son message prêt, sa valeur, sa confiance et le garde-fou qui s'applique.
- **Valider** exécute l'action : pour une règle de message, le message part par `notification` (FR-161) et la cible passe `EXECUTEE` ; la validation est un événement du journal. **Reporter** enregistre une date ; la cible revient à cette date. **Ignorer** exige un motif ; la cible ne revient pas pour cette règle pendant une durée paramétrable.
- Valider, Reporter et Ignorer sont enregistrés : un rechargement ne les perd pas ; ils sont lus par les autres écrans.
- Une validation ne passe pas outre un garde-fou : valider une cible `RETENUE` est refusé `GARDE_FOU_ACTIF`.
- Valider un message de mise en demeure exige le rôle du palier (FR-114).
- « Annuler » une validation est possible tant que l'action n'est pas partie ; sinon l'action est réversible ou non selon l'Exécution (FR-161).
- Une décision de la file relève du modèle de FR-14 lorsqu'elle porte de l'argent ou un crédit.

#### FR-161 : L'exécution est réelle

Une règle `AUTO` ou une cible validée s'exécute réellement. Réalise UJ-4.

**Conséquences (testables) :**
- Une règle de message `AUTO` envoie par `notification` à l'heure prévue. Le libellé « Départ automatique demain 08:00 » correspond à un envoi réellement planifié, annulable avant l'heure.
- Chaque Exécution est un fait : règle, cible, heure, résultat (délivré, échoué, annulé). Les statistiques de 30 jours en sont calculées (FR-157).
- Une Exécution qui échoue n'est pas rejouée sans limite : un nombre de tentatives paramétrable, puis `ECHEC` visible.
- Un envoi refusé par `notification` (désabonné, canal absent) est une Exécution `RETENUE` avec le motif.
- Une règle `AUTO` désactivée (FR-162) n'envoie plus rien dès l'instant de la désactivation, y compris pour les envois déjà planifiés (ils sont annulés et journalisés).
- Le temps gagné affiché = nombre d'Exécutions × minutes par action (paramétrable). C'est une estimation et il est libellé « estimé » (FR-15).

#### FR-162 : Activer et désactiver une règle, pour de vrai

Un rôle habilité peut activer ou désactiver une règle de son poste. Réalise UJ-4.

**Conséquences (testables) :**
- L'interrupteur est enregistré côté serveur (événement `REGLE_ON` / `REGLE_OFF`, auteur, date). Un rechargement ou un autre navigateur le retrouvent.
- Une règle désactivée produit zéro cible et zéro envoi ; sa carte est grisée ; la synthèse, le badge du menu, les compteurs des cockpits et le journal de la nuit se recalculent. Test : désactiver une règle fait baisser le badge.
- Désactiver une règle `AUTO` de blocage de crédit n'enlève aucun blocage existant (FR-119).
- Réactiver ne rejoue pas les cibles manquées pendant la pause.

#### FR-163 : Le journal de la nuit

Chaque cockpit peut afficher « Cette nuit, sans vous » : ce que les règles ont fait pendant la période. Réalise UJ-4, UJ-5.

**Conséquences (testables) :**
- Le journal de la nuit est la liste des Exécutions de la période, regroupées par domaine : marketing (messages partis, leads qualifiés, clients protégés exclus des promotions, à valider), recouvrement (relances parties seules, en attente de vous, promesses à surveiller), stock (voir la partie 2).
- Chaque ligne renvoie à son Exécution. Aucune ligne n'est un compteur écrit en dur.
- Le journal indique pour chaque entrée : exécutée, proposée, ou escaladée (le poste qui aurait dû décider), réversible ou non.
- La période par défaut est « depuis ma dernière connexion » ; elle est modifiable.
- Un module non installé n'a pas de bloc ; il n'affiche pas « 0 ».

#### FR-164 : Un badge qui compte le travail réel

Le menu affiche un badge : le nombre de cibles en attente de l'utilisateur. Réalise UJ-4.

**Conséquences (testables) :**
- Badge = nombre de cibles `EN_ATTENTE` des règles `A_VALIDER` et `SUGGESTION` actives, dans le Périmètre de l'utilisateur.
- Valider, reporter ou ignorer une cible fait baisser le badge à l'instant (la démo ne le recalculait pas).
- Désactiver une règle fait baisser le badge (FR-162).
- Un badge à 0 disparaît ; il ne montre pas « 0 ».
- Le badge est le même nombre que celui de la file (FR-160) : un test compare les deux.

**Règles de calcul reprises de la démo.**
- Garde-fou transverse : exclusion si retard > 30 jours, crédit bloqué ou statut à risque ; quota de 2 messages par client et par semaine (FR-159).
- Modes AUTO, À VALIDER, SUGGESTION (FR-158).
- Trois niveaux de confiance toujours affichés (FR-158).
- Équivalent temps plein = heures ÷ 150 par mois [ASSUMPTION: la démo utilise 150 ; paramétrable].
- **Non reprises :** statistiques et gains de temps constants ; départ « demain 08:00 » en texte ; badge calculé sur les règles brutes.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| Interrupteur d'une règle | simulé (page seule) | FR-162 |
| Valider une cible | simulé (aucun envoi) | FR-160, FR-161 |
| Ignorer une cible | simulé | FR-160 |
| Reporter | absent | FR-160 |
| Lancer / Modifier le message / Ignorer (cockpits) | mort | FR-160 |

**Notes.**
- [ASSUMPTION: une file d'arbitrage unique pour toutes les règles, au lieu d'une par cockpit ; chaque cockpit en affiche sa part.]
- Question : un Copilot conversationnel et le « chatbot » de qualification de leads sont promis par la documentation et absents de la démo ; boutons « bientôt », sans date.

---

### 6.8 Tableau de bord et pilotage (`dashboard`, M28)

**Dans la démo.** `/dashboard` affiche un cockpit par rôle (`DashboardDG`, `DC`, `RespVentes`, `Superviseur`, `Commercial`, `Freelance`, `Prospection`, `Stock`, `GestEntrepot`, `Finance`, `Comptable`, `ControleGestion`, `Marketing`, `Recouvrement`). Chaque rôle hors DG a un panneau de performance de poste (FR-122). Le DG voit : bandeau « Les chiffres qui engagent une décision » (8 chiffres), courrier des rapports de gestion, rapport de direction, 10 KPI 360°, carte des zones, alertes, prévisions, balance âgée, top impayés.
- **Les valeurs viennent des registres (« une seule source de vérité »)**, mais **les variations sont des constantes** (4,2 / −8,4 / 12 / 18,6 / 2,1 / 1,7 / 3,4 / 5,8 %) ; la « moyenne 30 jours » du CA journalier est égale au CA du jour ; le « CA annuel » est un cumul de 6 mois ; le « total commandes » est le nombre de commandes du jour.
- **MORT :** le bouton « N alertes critiques » (aucun gestionnaire) ; l'encart « Attention » (texte figé) ; les décisions recommandées de `/equipe` et les 5 décisions marketing (lecture seule).
- **SIMULÉ :** « Valider » / « Reporter » d'une décision du DG (journal local, aucune écriture passée, aucune notification) ; « PDF » (`window.print()`) et « Envoyer par e-mail » (`mailto:` avec un résumé).
- **Rapport de direction :** généré par des gabarits de texte sur les registres, sans modèle ; date figée « 11/06/2026 à 06:00 » ; badge « AUTO 06:00 » décoratif ; aucun historique ni destinataire configurable.
- **Les alertes** sont trois mécanismes sans objet : bouton, encart, anomalies en lecture seule. Aucun cycle de vie.

**Noyau commun.**
- **Tableau de bord par rôle** : une composition d'éléments (bandeau de chiffres, alertes, décisions à trancher, file de travail, KPI de poste) définie par Rôle. Les éléments sont des données ; le contenu d'un élément vient des modules.
- **Chiffre de décision** : `cle`, `libelle`, `valeur`, `format`, `famille`, `detail`, `variation` (calculée, avec sa période de référence), `sens` (une hausse est mauvaise ou non), `statut` (`SAIN`, `ATTENTION`, `CRITIQUE`), `seuils`, `action` (libellé + écran). Trois familles : « Argent disponible », « Ce qu'on me doit / ce que je dois », « Activité ».
- **Alerte** et **Décision à trancher** : l'objet unique de FR-14 (`A_TRANCHER` → `VALIDEE`, `REFUSEE`, `REPORTEE`, journal). Ce module les présente, il ne les redéfinit pas.
- **Rapport de direction** : `periode`, `destinataire`, `sections`, `genere_a`, `source` (règle ou modèle, version), `statut` (`GENERE`, `ENVOYE`, `LU`), `pdf`.
- **Courrier de rapports** : les rapports de gestion reçus (FR-155).

Règle du noyau : chaque cockpit est un **assemblage de lectures** de modules. Un élément dont le module est absent affiche « non installé », jamais 0.

**Vocabulaire par verticale.** Le noyau du tableau de bord est identique ; ce qui change est l'ensemble des chiffres de décision, qui est une donnée de paramétrage.
| Chiffre du noyau | Distributeur (8 chiffres du DG) | IMF [ASSUMPTION] | Assurance [ASSUMPTION] |
|---|---|---|---|
| Argent disponible | solde caisse et banque ; bénéfice net | trésorerie et liquidité ; résultat net | trésorerie ; résultat |
| Ce qu'on me doit | crédit client (encours) | encours de prêts et PAR | primes à recevoir |
| Ce que je dois | dette fournisseurs | épargne collectée, dettes | provisions et réserves (hors module) |
| Activité | CA du jour, du mois, cumulé ; total des commandes | décaissements, collecte du jour, du mois | primes émises ; sinistres |

**Propre au distributeur.** Les 8 chiffres du DG et leurs seuils (FR-166) ; les 10 KPI 360° ; la carte et le pilotage par zone et par entrepôt ; les cockpits de stock, d'entrepôt, de prospection (parties 2).

---

#### FR-165 : Un cockpit par rôle, relu des modules

Chaque rôle peut ouvrir son tableau de bord, composé pour lui. Réalise UJ-2, UJ-3, UJ-4, UJ-5.

**Conséquences (testables) :**
- Le DG, le DC, le responsable des ventes, le superviseur, le commercial, le freelance, le chargé de prospection, le responsable stock, le magasinier, le DAF, le comptable, le contrôleur de gestion, le marketing et le responsable du recouvrement ont chacun leur composition. Un rôle ne voit pas le cockpit d'un autre (FR-7) ; aucun écran ne s'intitule « Vue DG » pour un autre rôle.
- Un commercial voit « Bonjour {prénom} » : ses visites, ses commandes, son CA, sa prochaine visite, son encaissé (calculés sur ses visites, FR-107, FR-122). Un superviseur voit les tournées du jour de son périmètre (couverture, strike rate, écart de caisse réels, FR-105). Un recouvrement voit sa file (FR-120).
- Les éléments sont lus sur le serveur dans le Périmètre du rôle (FR-6). Aucun chiffre n'est une constante (FR-15) : changer une visite ou une facture change le cockpit (SM-5).
- Chaque rôle hors DG a son panneau de performance de poste (FR-122, FR-123) ; le DG n'a pas de KPI de poste et voit la matrice (FR-124).
- Un élément dont le module source n'est pas installé affiche « non installé ».
- Les 10 KPI 360° du DG suivent les mêmes règles.

#### FR-166 : Les 8 chiffres du DG

Un DG peut lire les 8 chiffres qui engagent une décision, chacun avec son statut et son action. Réalise UJ-5.

**Conséquences (testables) :**
- Les 8 chiffres, leur calcul et leur règle de statut (valeurs initiales de la démo, seuils paramétrables par Organisation) :

  | # | Chiffre | Calcul | Statut | Action |
  |---|---|---|---|---|
  | 1 | Solde caisse et banque | somme des comptes de trésorerie (FR-137) | SAIN ≥ 100 M ; ATTENTION ≥ 60 M ; sinon CRITIQUE | Voir la trésorerie |
  | 2 | Bénéfice net du mois | résultat du mois (FR-153) ; marge nette en % du CA | SAIN ≥ 5 % ; ATTENTION ≥ 3 % ; sinon CRITIQUE | Compte de résultat |
  | 3 | Crédit client | somme des restes dus (FR-112), dont plus de 30 jours | CRITIQUE si la part en retard > 40 % de l'encours | Voir les impayés |
  | 4 | Dette fournisseurs | dette totale, dont échue (FR-67) | CRITIQUE si échu > 40 M ; ATTENTION si > 15 M | Échéancier fournisseurs |
  | 5 | CA journalier | CA du jour, commandes du jour | SAIN [ASSUMPTION : seuil sur objectif quotidien] | Voir les commandes |
  | 6 | CA mensuel | CA du mois ; % de l'objectif du mois | SAIN ≥ 95 % ; ATTENTION ≥ 85 % | Pilotage par zone |
  | 7 | CA cumulé de l'exercice | somme des mois écoulés ; % de l'objectif cumulé | SAIN ≥ 95 % ; ATTENTION ≥ 85 % | Pilotage financier |
  | 8 | Total des commandes | commandes du jour et commandes terrain du mois | SAIN [ASSUMPTION : seuil sur objectif] | File de préparation |

- **Les variations sont calculées** : valeur de la période ÷ valeur de la période de comparaison (mois précédent, ou moyenne des 30 derniers jours) ; la période de comparaison est affichée. Plus de constantes. Test : changer une facture change la variation.
- La « moyenne sur 30 jours » du CA journalier est la moyenne des 30 derniers jours, pas le CA du jour. Le « CA annuel » s'appelle « CA cumulé de l'exercice » et couvre l'exercice courant.
- Un chiffre `CRITIQUE` remonte visuellement et crée une Alerte (FR-14). Un chiffre `SAIN` ne génère rien.
- Un chiffre dont la source n'est pas installée affiche « non installé » (par exemple, la dette fournisseurs sans `approvisionnement`).
- Chaque chiffre a son bouton d'action vers l'écran concerné, restreint par la table d'accès du rôle (FR-5).
- Les seuils sont des garde-fous paramétrables (FR-13), pas des constantes ; ceux de la démo dépendent de la taille de l'Organisation (FR-10).
- Export CSV du bandeau (FR-18).

#### FR-167 : Alertes du jour

Un rôle peut lire les alertes de son Périmètre ; un DG voit le nombre d'alertes critiques et les ouvre. Réalise UJ-5.

**Conséquences (testables) :**
- Une alerte est l'objet de FR-14 : `domaine`, `severite` (`CRITIQUE`, `HAUTE`, `MODEREE`), `titre`, `detail`, `responsable`, `source` (règle), `heure`, `statut` (`OUVERTE`, `PRISE_EN_CHARGE`, `RESOLUE`), lien vers l'objet concerné (la Créance, le Tiers, la visite, le combo).
- Le bouton « N alertes critiques » est le nombre réel d'alertes critiques ouvertes du Périmètre ; il ouvre la liste (la démo : aucun gestionnaire).
- Une alerte est créée par une règle. Exemples déjà posés : écart de caisse (FR-105), visite hors zone (FR-102), Dossier critique non traité (FR-120), chiffre critique (FR-166), plancher de trésorerie (FR-137), écart de budget critique (FR-152), campagne hors budget (FR-142).
- L'encart « Attention » du DG est la liste réelle des alertes critiques ; il n'est plus un texte figé.
- Une alerte se prend en charge (un rôle s'en charge), se résout (avec motif), ou se rouvre. Chaque transition est tracée.
- Un rôle ne voit que les alertes de son Périmètre (FR-6).

#### FR-168 : Décisions à trancher

Un DG peut valider, refuser ou reporter ses décisions à trancher, avec effet réel. Réalise UJ-5.

**Conséquences (testables) :**
- La liste est celle de FR-14 : les décisions réellement `A_TRANCHER` pour le rôle, dans l'ordre de priorité. Elle regroupe provision (FR-129), crédit client (FR-140), combo (FR-145), validation d'achat (partie 2, FR-63), remise (FR-127), blocage de crédit (FR-119). Les 5 décisions écrites à la main de la démo disparaissent.
- Chaque décision affiche : sujet, montant ou impact, décideur requis, échéance, options, auteur de la demande.
- **Valider**, **Refuser**, **Reporter** sont enregistrés (statut, auteur, heure, motif ; motif obligatoire pour refuser). Cliquer deux fois ne l'efface pas ; une correction est un nouvel événement du journal.
- La validation a un **effet réel** : une provision validée passe son écriture à `VALIDEE` ; un crédit accordé change le plafond (FR-140) ; un combo validé passe au marketing (FR-145) ; une remise validée libère la commande. Test sur UJ-5 : le DG valide la provision de Kiosque du Port ; l'écriture est validée et la balance change.
- Une décision reportée revient à sa date. Une décision hors du plafond de validation du rôle est renvoyée au niveau supérieur (FR-13) : DAF puis DG.
- Le DAF est averti d'une décision qui lui revient (« en attente de votre signature ») par `notification` ou par sa file.
- Le journal des décisions (qui, quand, choix, réversible) est consultable par le DG et le DAF, filtrable, exportable.

#### FR-169 : Le rapport de direction

Un DG peut lire le rapport de direction de la période, généré depuis les données. Réalise UJ-5.

**Conséquences (testables) :**
- Structure (reprise de la démo) : (1) en-tête avec date de génération, période et destinataire ; (2) analyse de situation ; (3) analyse par domaine (ventes terrain, facturation et encaissements, stock et entrepôts, réseau freelance et marges, objectifs et prévisions) ; (4) lecture opérationnelle par entrepôt, canal et famille ; (5) chiffres clés ; (6) alertes immédiates ; (7) points forts et points d'attention ; (8) recommandations priorisées 1 à 3 avec impact et délai ; (9) prévisions à 30 jours et comparaison avec le mois précédent ; (10) pied.
- Toute valeur vient des modules (FR-15). Une section dont le module est absent dit « non installé ».
- Les **alertes immédiates** sont les alertes réelles (FR-167), pas des chaînes préfixées ; les **recommandations** sont les décisions et actions réellement ouvertes.
- La comparaison avec le mois précédent est calculée, avec sa période ; le caractère favorable ou défavorable d'une variation vient du sens du chiffre (FR-166), pas d'une expression régulière sur son nom.
- **Provenance** : le rapport indique comment il a été produit (« règle et gabarit », version, date de génération) ; il ne se dit pas « IA » tant qu'aucun modèle ne l'a rédigé. S'il est un jour rédigé par un modèle, il porte son nom, sa version et sa date (FR-16).
- Chaque rapport généré est conservé (historique) avec son destinataire et sa période ; l'« AUTO 06:00 » est une génération réellement planifiée (heure paramétrable), pas un badge.
- La mention « économie estimée : 4 h/semaine » est retirée tant qu'elle n'est pas mesurée.

#### FR-170 : PDF et Envoyer, pour de vrai

Un DG peut télécharger le rapport de direction en PDF et l'envoyer. Réalise UJ-5.

**Conséquences (testables) :**
- « PDF » produit un fichier PDF réel (FR-17), mis en page, conservé avec le rapport ; ce n'est pas `window.print()`.
- « Envoyer » ouvre une sélection de destinataires (le DAF, d'autres rôles ou des adresses) et envoie le rapport par `notification` (e-mail ou WhatsApp) avec le PDF ou un lien. L'envoi est un événement du rapport (destinataire, heure, résultat). Il ne passe pas par le client de messagerie de l'utilisateur.
- Test UJ-5 : le DG envoie le rapport au DAF ; le DAF le trouve dans son courrier, l'ouvre ; le statut passe `LU` avec l'heure.
- Sans `notification` : « Envoyer » est « non installé » ; le téléchargement du PDF reste possible.
- Le DG peut programmer un envoi récurrent (hebdomadaire) à des destinataires choisis. [ASSUMPTION: récurrence hebdomadaire seulement en première version.]

#### FR-171 : Exports et courrier de gestion

Un rôle peut exporter les listes de son tableau de bord et lire le courrier des rapports de gestion. Réalise UJ-5.

**Conséquences (testables) :**
- Chaque bandeau, liste d'alertes, liste de décisions, balance âgée et liste d'impayés se télécharge en CSV, et en PDF quand c'est un rapport (FR-17, FR-18). Un export respecte le Périmètre du rôle.
- Le courrier du DG et du DAF liste les rapports de gestion reçus (FR-155) : titre, émetteur, date, statut `ENVOYE` ou `LU`, avec le PDF. Marquer `LU` est enregistré.
- Les 10 KPI 360° et la carte des zones suivent les mêmes règles : valeur calculée, période affichée, « non installé » si la source manque.
- Un tableau de bord vide (aucun module installé) affiche l'invitation à installer, pas des zéros.

**Règles de calcul reprises de la démo.**
- Statuts des 8 chiffres et seuils (FR-166).
- Statut de score de poste (FR-123).
- Boutons d'action des chiffres : liens vers les écrans (repris).
- Structure du rapport de direction : 10 sections (FR-169).
- **Non reprises :** variations constantes ; moyenne sur 30 jours égale au CA du jour ; « CA annuel » de 6 mois ; encart « Attention » figé ; date du rapport figée ; badge « AUTO 06:00 » décoratif ; « 4 h/semaine » non mesuré ; `mailto:` pour l'envoi.

**Boutons de la démo.**
| Bouton | État dans la démo | Exigence |
|---|---|---|
| N alertes critiques (bandeau) | mort | FR-167 |
| Valider / Reporter (décision du DG) | simulé | FR-168 |
| Refuser (décision du DG) | absent | FR-168 |
| Exporter PDF (rapport de direction) | `window.print()` | FR-170 |
| Envoyer par e-mail | `mailto:` | FR-170 |
| Export CSV du bandeau | branché (navigateur) | FR-166, FR-171 |
| Copilot (questions en langage naturel) | absent (promis par la documentation) | « bientôt », sans date |

**Notes.**
- [ASSUMPTION: le code `dashboard` est « déprécié » au catalogue (M28) ; ce module est à réactiver. Les cockpits restent une composition de lectures et ne possèdent pas de données propres.]
- [ASSUMPTION: les seuils des 8 chiffres sont des garde-fous paramétrables (valeurs de la démo) ; en absolu, ils ne conviennent qu'à un grand grossiste.]
- Question : le « Copilot » est-il un module ? Hors de ce PRD.

---

### 6.9 Support client et CRM interne (`support-client`, M03)

Ce module est **hors de ce PRD, à cadrer au lot 4**. La démo `prospera-distributeur` ne contient aucun écran de support client ni de CRM interne : il n'y a aucune exigence à tirer d'elle, et ce PRD n'en invente pas. La console d'administration de Money Vibes devenue CRM interne (plan à deux développeurs) est une affaire de la plateforme, pas du produit du distributeur.

- Le code `support-client` est au catalogue, marqué « déprécié ».
- Aucune exigence FR n'est posée ici ; aucun numéro n'est réservé.
- Quand le lot 4 le cadrera, il suivra la même règle que cette partie : un noyau commun, un tableau de vocabulaire par verticale, ce qui est propre à chacune.

---

---

## 7. Partie 4 — Les modules déjà cadrés : fiches de renvoi

Huit modules dont le distributeur a besoin ont déjà leur PRD, leur spine et leur manifeste : `reseau`, `pdv`, `catalogue`, `stock`, `paiement`, `notification`, `reprise`, `connecteurs`. **Ce PRD n'en réécrit rien.** Chaque fiche ci-dessous dit trois choses : ce que la démo montre et que le PRD du module couvre déjà (renvoi par identifiant, pas de recopie) ; ce que la démo exige en plus ou autrement (les écarts, chacun devenu une exigence numérotée FR-180 à FR-219, avec sa conséquence testable) ; ce que le PRD du module exige et que la démo ne montre pas (les écrans à créer, que la démo ne définit pas).

Règles de lecture, valables pour tout le chapitre.

- La démo (`prospera-font-end/prospera-distributeur`) définit le produit. Sa seule exception est une décision postérieure et explicite du PO (carte Google Maps, PI-SPI **et** FedaPay).
- Une exigence ci-dessous est un **écart à porter au PRD du module** : le propriétaire du PRD du module l'amende (ou la refuse) avant la validation du lot ; tant qu'il ne l'a pas fait, l'exigence tient ici et ne se code pas à la place du module.
- La démo n'a ni serveur ni base : tout écran « absent de la démo » est à concevoir, jamais à deviner. Les boutons non branchés sont **« bientôt »**, pas des fonctions.
- Le client de février est un grossiste qui quitte Sage ; il n'est pas nommé ici. Le jeu de test est le grossiste fictif « Grossiste du Golfe » (jus et boissons), défini en partie 1.
- Les identifiants de la forme `FR-Cnn`, `FR-Vnn`, `FR-Snn`, `FR-Pnn`, `FR-Nnn`, `FR-Rnn` renvoient au PRD du module nommé dans la fiche ; `Reprise FR-n` et `Connecteurs FR-n` au PRD Reprise ou Connecteurs. Les identifiants `FR-180` à `FR-219` sont ceux de ce PRD.

| Module | Code | Réf. M | PRD | Manifeste |
|---|---|---|---|---|
| Réseau, agences & zones | `reseau` | M01 | `prd-reseau-zones-2026-08-02` | `manifestes/reseau.manifest.ts` |
| CRM points de vente & pipeline | `pdv` | M02 | `prd-pdv-2026-08-02` | `manifestes/pdv.manifest.ts` |
| Catalogue, produits & tarification | `catalogue` | M04 | `prd-catalogue-produits-2026-08-02` | `manifestes/catalogue.manifest.ts` |
| Stock & logistique | `stock` | M06 | `prd-stock-2026-08-02` | `manifestes/stock.manifest.ts` |
| Encaissements & moyens de paiement | `paiement` | M33 | `prd-paiement-service-2026-08-02` (+ amendement 2026-09-21) | `manifestes/paiement.manifest.ts` |
| Canaux & notifications | `notification` | M34 | `prd-notification-service-2026-08-02` | `manifestes/notification.manifest.ts` |
| Reprise de données | `reprise` | M44 | `prd-reprise-donnees-2026-11-10` | `manifestes/reprise.manifest.ts` |
| Connecteurs | `connecteurs` | M43 | `prd-connecteurs-2026-11-10` | `manifestes/connecteurs.manifest.ts` |

---

### 7.1 Réseau, agences et zones (`reseau`, M01) — PRD `prd-reseau-zones-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** La zone et sa portée d'accès : FR-R01 (zone), FR-R12 (hiérarchie à profondeur configurable), FR-R24, FR-R24b, FR-R24c (portée en lecture et en écriture). La démo cadre un rôle sur ses zones : le menu « Mon portefeuille / Mes zones / Vue DG » des points de vente (`PointsDeVenteView.tsx:24-33`) et le responsable des ventes cadré sur `user.zones` (`EquipeView.tsx:122-123`). La couverture d'une zone et les zones blanches (FR-R31, FR-R32) se retrouvent dans « couverture secteur % » (`CommercialTerrainView.tsx:57,316,417`) et la carte (`CarteCommercialDG.tsx`). Les deux entrepôts (Lomé Port, Kara) sont des lieux à rattacher à une zone (FR-R16). Le manifeste `reseau` déclare `depends: []`, `enrichiPar: ['pdv','stock']`, cinq droits `reseau:*` (FR-R35) et deux objets de reprise (`reseau.zone@1`, `reseau.commercial@1`).

**Écarts à porter au PRD du module.**

#### FR-180 : Zones à plat et deux entrepôts comme jeu de départ
Le distributeur de février n'a ni agences, ni secteurs, ni sous-secteurs : la démo ne montre que des zones à plat et deux entrepôts. Le gabarit d'installation du distributeur crée une hiérarchie d'un seul niveau (zones) et rattache chaque entrepôt à une zone ; la profondeur configurable (FR-R12) reste disponible mais **n'est pas exigée pour la recette de février**.
**Conséquences (testables) :** (1) sur le jeu « Grossiste du Golfe », la reprise de `reseau.zone@1` produit N zones sans nœud intermédiaire et aucun écran n'exige un niveau « agence » ; (2) Lomé Port et Kara apparaissent chacun rattachés à une zone, lisibles par `stock` ; (3) un module d'écran `reseau` installé chez un distributeur n'affiche pas les mots « agence » ni « secteur » (vocabulaire en donnée, C6).

#### FR-181 : Le cadrage par zone vaut aussi en écriture
La démo cadre le responsable des ventes et le superviseur en **lecture** seulement ; le PRD impose la portée d'écriture (FR-R24b, FR-R24c). Le distributeur adopte la règle du PRD : un superviseur peut lire sa région et ne modifier que sa zone.
**Conséquences (testables) :** (1) un superviseur dont la portée de lecture est « région » et la portée d'écriture « zone A » reçoit un refus nommé en modifiant un point de vente de la zone B qu'il voit ; (2) la démo, rejouée sur le vrai backend, ne montre plus un bouton d'écriture actif sur une ligne hors de la portée d'écriture ; (3) le gabarit de données du jeu de test contient au moins un superviseur dans ce cas.

#### FR-182 : Le classement des commerciaux par couverture n'est pas calculé par `reseau`
« Top couverture » (`CommercialTerrainView.tsx:417`) classe des **personnes**, et « Rang zone » d'un point de vente (`PdvRapportView.tsx:119`, `rang_ca_zone`) classe par chiffre d'affaires dans la zone. `reseau` calcule la couverture d'une zone (FR-R31) et la compte sans la juger : il ne classe ni les commerciaux ni les points de vente. Le classement relève de `terrain` (taux de couverture du secteur par commercial) et de `dashboard` (rang de zone, qui a le chiffre d'affaires par `commande` et `facturation`).
**Conséquences (testables) :** (1) le contrat de lecture de `reseau` ne contient aucun champ de rang ni de classement (test de schéma) ; (2) `terrain` publie un taux de couverture par commercial dont la source déclarée est `reseau.zone` et `pdv.point-de-vente` ; (3) sans `terrain` installé, l'écran de couverture n'affiche que le décompte de `reseau`, et le rang affiche « non installé », pas 0.

#### FR-183 : Zones blanches : le signalement est `reseau`, la carte est `pdv`
Une zone blanche est une zone sans rattachement actif (FR-R32). La démo la montre seulement dans l'audit (« zones blanches », `AUDIT_PERSONAS_AMELIORATIONS.md:266`) et la conquête (`conquete-objectifs`) la travaille. La carte étant Google Maps (FR-192), `reseau` fournit la liste des zones blanches et `pdv` les dessine.
**Conséquences (testables) :** (1) sur le jeu de test, créer une zone sans aucun point de vente la fait apparaître dans la liste des zones blanches en moins d'une actualisation de lecture, et la fait disparaître dès qu'un point de vente actif s'y rattache ; (2) `conquete-objectifs`, installé ou non, ne crée jamais de zone : il lit la liste ; (3) une zone fermée n'est pas une zone blanche.

**Ce que le PRD exige et que la démo ne montre pas.** Tous ces écrans sont à créer, car aucun n'existe dans la démo : redécoupage versionné (FR-R05, FR-R05b) ; agences, horaires, paramètres (FR-R06 à FR-R10) ; déplacement d'un nœud avec compte rendu (FR-R14) ; rattachement des lieux aux zones, desserte principale et de secours (FR-R16 à FR-R18) ; affectations datées et nœud sans responsable (FR-R20 à FR-R22) ; attribution d'une portée, droit le plus sensible (FR-R36) ; import (FR-R37) ; audit (FR-R40). Décision : pour la recette de février, seuls l'écran de zones (créer, fermer, rattacher un entrepôt), l'affectation datée d'un commercial et l'attribution de portée (FR-R36) sont exigés ; le redécoupage versionné, les agences et le déplacement avec compte rendu sont `bientôt`. [ASSUMPTION : réduction de périmètre de février proposée par ce PRD, sans source ; à confirmer par le PO.]

---

### 7.2 Points de vente (`pdv`, M02) — PRD `prd-pdv-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Identité, zone et nature `PROPRE` / `PARTENAIRE` (FR-V01 ; `PointsDeVenteView.tsx:169`) ; commercial affecté (FR-V08) ; pipeline (FR-V15) ; vue unique avec commandes, livraisons, créances et ancienneté, visites (FR-V22 ; `PdvRapportView.tsx:134-332`) ; segments actifs / dormants / VIP (FR-V26) ; carte de couverture (FR-V27) ; champs de score (FR-V34) ; candidats pour l'assistant (FR-V37) ; listes pour le marketing (FR-V29 ; `garde-fous.ts:86-93`). Le manifeste `pdv` déclare `depends: [reseau]`, `enrichiPar: [stock, commande, facturation, terrain, recouvrement, catalogue]`, neuf droits `pdv:*` et deux objets de reprise (`pdv.point-de-vente@1`, `pdv.affectation@1`).

**Écarts à porter au PRD du module.**

#### FR-184 : Le score de santé ne s'affiche qu'avec sa provenance, et il a un producteur dès le premier jour
La démo calcule un « Score santé IA » (`PdvRapportView.tsx:80-84`) et un « Scoring IA temps réel » (`PointsDeVenteView.tsx:217-218,303`), l'affiche sur chaque fiche et le montre aussi au commercial et au freelance. Le PRD (FR-V34, FR-V35, FR-V36) interdit à `pdv` de calculer un score, exige source, date et version de modèle, et interdit d'afficher un score sans provenance comme un fait ; la clause C11 (point 6) répète la règle. La démo n'affiche ni source, ni date, ni version. Ce PRD tranche : le score de santé est produit, pour le premier jour, par le module `dashboard` (scoring déterministe, version `règles-1.0`) [ASSUMPTION : producteur et nom de version proposés, sans source ; le PO tranche si le producteur est `dashboard` ou le futur module de scoring différé de FR-V36], déposé dans le champ de score de `pdv` par un contrat nommé.
**Conséquences (testables) :** (1) tout score affiché porte, à côté, sa source, sa date et sa version ; un score sans ces trois éléments s'affiche « non évalué », jamais en chiffre ; (2) sans `dashboard` installé, le champ est déclaré vide et visible comme tel (FR-V36), et le test C4 vérifie `NON_INSTALLE` ; (3) la fiche d'un commercial ou d'un freelance ne montre que les scores de **son** portefeuille ; (4) un score de plus de 30 jours porte un libellé « périmé » [ASSUMPTION : seuil de 30 jours proposé, sans source].

#### FR-185 : Le pipeline a six états dans la démo, cinq dans le PRD
La démo : `PROSPECTION`, `PREMIER_CONTACT`, `PREMIERE_COMMANDE`, `ACTIF`, `FIDELE`, `A_RISQUE` (`types/index.ts:17-23`). Le PRD (FR-V15) : prospection → actif → fidèle, plus `à risque` et `perdu`. La démo a deux états de plus (premier contact, première commande) et pas de `perdu`. Décision : les **sept** états sont ceux de la démo plus `perdu`, car `perdu` est exigé par FR-V15 et le recouvrement en a besoin ; les libellés viennent de la donnée (`pipelineLabels`), conformément à FR-V17 (règles du distributeur), et `PREMIER_CONTACT` / `PREMIERE_COMMANDE` sont des états configurables que le distributeur peut désactiver.
**Conséquences (testables) :** (1) la liste des états d'un distributeur installé contient `PROSPECTION`, `PREMIER_CONTACT`, `PREMIERE_COMMANDE`, `ACTIF`, `FIDELE`, `A_RISQUE`, `PERDU` ; (2) désactiver `PREMIER_CONTACT` fait passer un prospect directement de `PROSPECTION` à `PREMIERE_COMMANDE` sans erreur ; (3) l'état n'est jamais repris de Sage : il se recalcule par les règles (décision du PO, 2026-11-12), et un lot repris ne porte aucun état ; (4) aucune règle de transition n'est du code : la garde de balayage de C6 ne trouve aucune comparaison à un libellé de client.

#### FR-186 : « Vue DG » : le commercial et le freelance n'ont pas les écrans de pilotage
La démo montre à un commercial une fiche étiquetée « Vue DG » (classement de zone, priorités du DG) au lieu de sa dernière visite, de ses relances et de son objectif du mois ; le responsable des ventes et le superviseur voient la même vue (`AUDIT_PERSONAS_AMELIORATIONS.md:21-27`). Le PRD pdv fournit les droits distincts « mon portefeuille » et « tout le réseau » (FR-V38). Ce PRD exige trois vues de la fiche, choisies par le droit, jamais par un nom de rôle : **vue de portefeuille** (commercial, freelance, prospection : dernière visite avec résultat et commentaire, relances en cours, objectif du mois, bouton « Appeler »), **vue de zone** (superviseur, responsable des ventes), **vue de direction** (DG, directeur commercial). 
**Conséquences (testables) :** (1) un compte sans le droit `pdv:reseau:consulter` n'obtient ni le rang de zone, ni les priorités du DG, y compris par une URL saisie à la main ; (2) un commercial ouvre une fiche et y voit la date, le résultat et le commentaire de sa dernière visite ; (3) la bascule entre vues est un fait de droit : retirer `pdv:reseau:consulter` à un DG test retire la vue de direction ; (4) sans `terrain` installé, « dernière visite » affiche `NON_INSTALLE`.

#### FR-187 : Plafond de crédit du client : le disponible à crédit est montré
Aucune fiche de la démo ne montre de plafond (seuls les fournisseurs en ont : `FicheFournisseur.tsx:109-112`) ; la proforma avertit seulement qu'un encours existe (`ProformaBuilder.tsx:302`). Le PRD porte le plafond, sa devise, sa suspension et son journal (FR-V30 à FR-V33) et ne l'applique pas (FR-V31). Ce PRD exige que la fiche et la saisie de commande montrent **plafond − encours = disponible à crédit**, l'encours venant de `facturation` (créances ouvertes) et le plafond de `pdv`, et que le plafond soit repris de Sage (valeur de contrôle `PLAFOND_SANS_OBJET` pour un magasin propre).
**Conséquences (testables) :** (1) sur le jeu de test, un client au plafond de 2 000 000 FCFA et à l'encours de 1 500 000 FCFA affiche un disponible de 500 000 FCFA ; (2) sans `facturation`, l'encours et le disponible affichent `NON_INSTALLE`, et jamais 0 ni le plafond entier ; (3) `commande` refuse ou avertit au dépassement selon son paramètre (blocage dur ou avertissement), jamais `pdv` ; (4) un plafond modifié sans motif est refusé (FR-V32) ; (5) après la reprise, la somme des plafonds repris égale la valeur de contrôle du lot.

#### FR-188 : Les conditions de règlement par client sont une exigence, pas un champ de texte
La démo connaît les modes `ESPECES`, `VIREMENT`, `CHEQUE`, `CREDIT_30J`, `CREDIT_45J`, `CREDIT_60J` (`types/index.ts:101`, `ProformaBuilder.tsx:19`) mais aucune fiche client ne les porte. Le manifeste `pdv` couvre « plafond, conditions de règlement » (`pdv:plafond:modifier`), et FR-V30 les cite, mais le PRD pdv n'a aucune exigence propre à leur sujet. Exigence : une **condition de règlement par défaut** par client, choisie dans un référentiel versionné du distributeur (comptant, 30 j, 45 j, 60 j, fin de mois…), reprise de Sage, lue par `commande` et `facturation` pour calculer l'échéance.
**Conséquences (testables) :** (1) une facture émise à un client « 30 jours » porte une échéance égale à la date de facture + 30 jours ; (2) changer le référentiel (ajouter « 90 j ») n'exige aucun déploiement ; (3) un client sans condition reçoit la condition par défaut de l'organisation, et le dit ; (4) le fichier clients de février reprend la condition, et une valeur inconnue du référentiel est rejetée avec la ligne du fichier dans le rapport de la Reprise.

#### FR-189 : L'état « crédit bloqué » est une suspension du plafond, décidée par `recouvrement`, écrite par `pdv`
La démo bloque et débloque le crédit depuis le recouvrement (`BalanceAgeeClientPanel.tsx:152-158`), avec trace des surcharges (`:27-29`), et exclut un client « crédit bloqué » du marketing (`garde-fous.ts:50-57`). Le PRD laisse le blocage à Commande ou Facturation (FR-V31) et prévoit la **suspension** du plafond sans l'effacer (FR-V33). Décision : bloquer le crédit = suspendre le plafond. `recouvrement` décide (impayé au-delà d'un seuil, ou action manuelle) et publie `recouvrement.credit.bloque@1` ; `pdv`, seul propriétaire du plafond (C3), applique la suspension et republie `pdv.plafond.changed@1` ; `commande` et `facturation` lisent ce second fait. Le déblocage suit le même chemin.
**Conséquences (testables) :** (1) un blocage décidé par `recouvrement` produit une suspension visible dans le journal du plafond de `pdv`, avec auteur, motif et référence du dossier ; (2) le plafond n'est pas remis à zéro et revient à sa valeur au déblocage ; (3) `commande` refuse une commande à crédit sur un client suspendu et accepte la même commande au comptant ; (4) sans `recouvrement`, aucun blocage automatique ne se produit et l'écran de blocage manuel de `pdv` reste disponible au détenteur de `pdv:plafond:modifier`.

#### FR-190 : L'écran de création et de modification d'un point de vente est à créer
La démo n'a aucun formulaire de création de point de vente. Le PRD exige l'identité, la géolocalisation et les photos (FR-V03, FR-V04), le dédoublonnage (FR-V06), la fermeture (FR-V07) et le droit `pdv:fiche:creer`. Écran à créer : formulaire de création (nom, contacts, zone, nature, commercial, position sur la carte Google Maps, conditions de règlement, plafond), contrôle des doublons avant enregistrement (téléphone d'abord, proximité ensuite), fermeture avec motif.
**Conséquences (testables) :** (1) créer un point de vente dont le téléphone existe déjà propose la fiche existante avant enregistrement ; (2) un point de vente sans position GPS est enregistré et signalé « non géolocalisé », jamais refusé ; (3) le point créé apparaît dans « Mon portefeuille » du commercial affecté au rechargement ; (4) un utilisateur sans `pdv:fiche:creer` ne voit pas le bouton « Nouveau point de vente ».

#### FR-191 : Les indicateurs commerciaux du point de vente ont chacun un module producteur
La fiche de la démo calcule CA du mois, évolution, CA moyen sur 6 mois, panier moyen, bons de livraison par mois, délai de livraison, taux de service et rang de zone (`PdvRapportView.tsx:112-120`). Le PRD pdv n'agrège que ce que les autres modules fournissent (FR-V22, FR-V24). Attribution : CA mois, évolution, CA moyen 6 mois, panier moyen → `facturation` (faits facturés) ; bons de livraison par mois, délai de livraison, taux de service → `commande` et `entrepot` ; rang de zone → `dashboard` (FR-182) ; « Stock en rupture au PDV » et « Assortiment & évolution produits » (`PdvRapportView.tsx:205-215,265`) → `stock` (FR-S56 à FR-S60) et `commande`.
**Conséquences (testables) :** (1) chaque indicateur de la fiche porte sa source et sa fraîcheur (FR-V23) ; (2) désinstaller un module producteur affiche `NON_INSTALLE` sur ses seuls indicateurs, la fiche reste ouverte ; (3) `pdv` ne contient aucune collection de chiffre d'affaires (garde de câblage C3).

#### FR-192 : La carte est Google Maps (le front de démo est en Leaflet)
La démo dessine la carte avec Leaflet et OpenStreetMap (`CarteCommercialDG.tsx:3-5`). La décision du PO du 2026-11-12, déjà au manifeste `pdv` (prérequis `fond-de-carte`), est Google Maps. Cette décision, postérieure et explicite, l'emporte sur la démo. Toute carte du produit (points de vente, équipe en temps réel, zones blanches, tournées) utilise le même fond.
**Conséquences (testables) :** (1) le prérequis `fond-de-carte` du manifeste est vérifié à l'installation, et son échec laisse la liste utilisable avec une carte vide et le message d'action ; (2) aucune dépendance Leaflet ni tuile OpenStreetMap dans le module d'écran livré (analyse des dépendances) ; (3) `terrain` n'embarque pas son propre fond de carte : il appelle le composant commun.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : géolocalisation et photos du point de vente (FR-V03, FR-V04) ; dédoublonnage et fusion (FR-V06) ; fermeture (FR-V07) ; propriété du portefeuille, réaffectation par lot, départ d'un commercial et révélation des prix d'un indépendant, points sans commercial (FR-V09 à FR-V14) ; transition expliquée, correction avec motif, historique (FR-V16 à FR-V21) ; source et fraîcheur de chaque élément (FR-V23) ; cache hors connexion du portefeuille (FR-V25, FR-V25b ; la démo ne parle que de la file d'attente d'une proforma) ; zones blanches (FR-V28) ; plafond et suspension (FR-V30 à FR-V33) ; droits et règles de pipeline (FR-V38, FR-V39) ; import (FR-V40) ; audit (FR-V43). Pour février : création, fiche, plafond, conditions, réaffectation et import sont exigés ; la révélation des prix à un départ (FR-V13) n'est exigée qu'avec l'add-on `freelance` ; le cache hors connexion est `bientôt` avec l'application mobile.

---

### 7.3 Catalogue (`catalogue`, M04) — PRD `prd-catalogue-produits-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Référence, nom, catégorie d'un produit (FR-C01, FR-C05 ; `types/index.ts:86-99`) ; un prix unitaire seul (FR-C13, partiel) ; combos, promotion, remise (FR-C18, FR-C19, partiels ; `combo-stock-workflow.ts`) ; rentabilité, rotation, engouement par produit (FR-C35 à FR-C38, partiels ; `catalogue-dg-builder.ts:64-72`). Le manifeste `catalogue` : `depends: []`, `enrichiPar: [reseau, pdv, stock, commande]`, quatre droits (FR-C48), deux objets de reprise (`catalogue.article@1`, `catalogue.grille@1`). La démo n'a pas de module catalogue séparé : `/catalogue` redirige vers `/stock?tab=catalogue` (douze articles, vues consolidée, par entrepôt, réseau).

**Écarts à porter au PRD du module.**

#### FR-193 : Le prix négocié d'un client est une grille dont la condition est « ce point de vente »
Le client de février demande la reprise des **prix propres à chaque client** (brain dump du PO). La démo ne montre jamais un prix résolu par client. FR-C14 ne prévoit comme conditions de grille que la zone, la catégorie de client et le seuil de volume. Décision (parties 2 et 3 de ce PRD) : le prix négocié par client est porté par la **grille de prix du `catalogue`**, avec une condition supplémentaire « point de vente » (référence opaque vers `pdv`, comme la zone l'est vers `reseau`, ASSUMPTION A2 du PRD catalogue). C'est un écart à combler dans le PRD catalogue : FR-C14 est à étendre, et `catalogue.grille@1` à compléter. Une catégorie de client à un seul membre est la solution de repli, non retenue car elle fabrique une catégorie par client.
**Conséquences (testables) :** (1) sur le jeu de test, un article à 4 500 FCFA au tarif société et à 4 200 FCFA pour un client nommé résout 4 200 FCFA pour ce client et 4 500 FCFA pour les autres, avec la grille résolue citée dans la ligne de commande ; (2) la priorité de résolution met la condition « point de vente » avant « catégorie » puis « zone » [ASSUMPTION : ordre de priorité proposé, à fixer dans FR-C16] ; (3) la reprise de Sage de 1 000 tarifs clients crée des grilles sans condition de catégorie fabriquée ; (4) un prix négocié sans prix société correspondant est signalé à la reprise, pas inventé ; (5) un export de `catalogue.grille@1` ne contient jamais de prix freelance (FR-C29).

#### FR-194 : L'unité de base et le conditionnement manquent à la démo
La démo ne connaît le carton que dans un nom de produit fournisseur (« Eau de Javel 1L (carton 12) », `commandes-fournisseurs-registry.ts:63`), dans `quantite_lot` (`types/index.ts:246-247`) et dans `unites_par_palette` (`entrepot-logistique-registry.ts:93-94`). Le PRD (FR-C06 à FR-C12) exige une unité de base immuable, des conditionnements à facteur versionné et un prix par article **et par unité** (FR-C13). Pour les jus et boissons, ce PRD exige que bouteille, pack et palette soient des conditionnements d'un même article, que tout stock soit tenu en unité de base, et que la commande, la facture et le bon de livraison portent l'unité vendue.
**Conséquences (testables) :** (1) un article « jus d'orange 1 L » a l'unité de base « bouteille » et les conditionnements « pack de 6 » et « palette de 120 packs » ; vendre 2 packs décrémente 12 bouteilles ; (2) changer le facteur d'un pack ne modifie aucun mouvement passé ; (3) un texte libre « carton 12 » repris de Sage est traduit par le gabarit de reprise, jamais inventé ; une ligne non traduisible est rejetée au rapport ; (4) le prix du pack n'est pas imposé comme 6 fois celui de la bouteille.

#### FR-195 : `marge_freelance` et `montant_client` ne sont pas montrés à la société
La démo expose `montant_societe`, `montant_client` et `marge_freelance` dans une commande (`commandes-registry.ts:69-70`), une « grille prix client » du freelance (`commercial-terrain-dg-builder.ts:87`) et un « CA société généré ». FR-C29 interdit à la société de voir les prix pratiqués par un freelance chez ses détaillants : aucune requête, aucun export, aucun tableau de bord, aucune restitution. `montant_client` dans la vue de commande du DG est une contradiction probable avec FR-C29, à confirmer avant la recette. Règle de ce PRD : la société voit **le montant société** (prix société résolu, FR-C31) ; elle ne voit jamais ni le prix client du freelance, ni sa marge ; le freelance voit les deux, pour son seul portefeuille (FR-C30).
**Conséquences (testables) :** (1) un compte DG, sur une commande d'un freelance, ne reçoit ni `montant_client` ni `marge_freelance` dans la réponse de l'API (test au niveau des données, pas de l'écran, FR-C29) ; (2) l'export CSV, le tableau de bord de direction et le rapport IA ne contiennent aucun de ces deux champs ; (3) à l'événement de départ du freelance (`pdv.commercial.parti@1`), la révélation des prix produit `catalogue.revelation.effectuee@1` et seulement alors ; (4) le seuil de remise et les alertes de marge du DG se calculent sur le montant société.

#### FR-196 : La visibilité de la marge par rôle (société) manque au PRD catalogue
La démo cache la marge commerciale à certains rôles : « le responsable stock arbitre en coût d'achat » (`StockView.tsx:142`, `voitValeurCommerciale`). Le PRD catalogue n'a de visibilité par rôle que pour les prix freelance. Exigence : un droit de consultation du **prix de revient et de la marge société**, distinct du droit de consulter les articles (`catalogue:article:consulter`), attribuable par rôle.
**Conséquences (testables) :** (1) un compte avec `catalogue:article:consulter` seul voit prix de vente et conditionnements, pas le coût de revient ni la marge ; (2) l'ajout du droit (par exemple `catalogue:marge:consulter`) passe par `auth-service` (catalogue des droits fermé, C7) avant la livraison ; (3) le responsable de stock voit la valeur d'achat de son stock et jamais la valeur commerciale, comme dans la démo. [ASSUMPTION : nom du droit proposé, sans source.]

#### FR-197 : Le catalogue a ses propres écrans, il n'est plus un onglet du stock
La démo range le catalogue dans `/stock?tab=catalogue`. Un module `catalogue` installable seul a besoin d'un module d'écran propre (C8) : liste des articles, fiche article, grilles, promotions, simulation de prix (FR-C27). L'onglet « Catalogue » du stock devient un lien vers le module d'écran, visible seulement si `catalogue` est installé.
**Conséquences (testables) :** (1) une organisation avec `catalogue` sans `stock` voit le menu « Catalogue » et aucune entrée de stock ; (2) une organisation avec `stock` (qui exige `catalogue` en dépendance dure) retrouve les douze articles du jeu de test dans le catalogue ; (3) l'URL `/catalogue` ne redirige plus vers `/stock`.

#### FR-198 : Le coût de revient vient du stock, pas du catalogue
Marge par article, « rentabilité » (`DEFICITAIRE`, `TENSION`, `CORRECTE`), rotation en jours, engouement et ruptures sur 3 mois (`CatalogueView.tsx:154-160`) sont de l'analyse. Le coût de revient (`cout_revient`, `catalogue-dg-builder.ts:64`) vient de la valorisation du stock (FR-S23, FR-S24), non du catalogue. Ce PRD place cette analyse dans `dashboard` (écran « Pilotage catalogue & assortiment »), qui lit `catalogue`, `stock`, `facturation`.
**Conséquences (testables) :** (1) sans `stock`, l'écran n'affiche ni coût de revient ni marge (`NON_INSTALLE`) ; (2) `catalogue` ne contient aucun champ de coût (test de schéma) ; (3) la rentabilité d'un article se recalcule quand la valorisation du stock change.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : références stables, identifiants externes, médias (FR-C02 à FR-C04) ; unité de base et conditionnements (FR-C06 à FR-C12, voir FR-194) ; grilles, conditions, priorité, versions (FR-C13b à FR-C17) ; cumul, plafonds de promotion, résolution du prix, simulation (FR-C20 à FR-C27) ; prix figé (FR-C25) ; « pas de prix » (FR-C26) ; cycle de vie et remplacement d'un article (FR-C41 à FR-C44) ; import et export (FR-C45 à FR-C47) ; droits et audit (FR-C48, FR-C49) ; l'écran « Mes prix » du freelance (FR-C28 à FR-C30). Pour février : fiche article avec conditionnements, grille société, grille « point de vente » (FR-193) et import sont exigés ; promotions, simulation et remplacement d'article sont `bientôt` sauf l'écran de simulation de prix, utile à la recette.

---

### 7.4 Stock (`stock`, M06) — PRD `prd-stock-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Entrepôts (FR-S01 ; Lomé Port, Kara ; `StockView.tsx:23-28`) ; magasins propres et partenaires (FR-S05b, FR-S05c) ; disponible / limité / rupture (FR-S08 ; `DisponibiliteView.tsx:15-18`) ; seuil, couverture en jours, rupture (FR-S35 à FR-S37) ; dormant, surstock, date limite menacée, capital qui dort, coût de portage (FR-S40 à FR-S46 ; `SanteStockPanel.tsx`) ; classe ABC et inventaire tournant (FR-S47 à FR-S51) ; transferts (FR-S52 à FR-S55 ; `TransfertsPanel.tsx`) ; réception (FR-S12 partiel). Le manifeste `stock` : `depends: [catalogue]`, `enrichiPar: [balance, commande, pdv, reseau, terrain]`, six droits (FR-S61) et deux objets de reprise (`stock.point-de-stock@1`, `stock.stock-ouverture@1`).

**Écarts à porter au PRD du module.**

#### FR-199 : Le stock est une somme de mouvements, la démo tient un compteur
La démo porte le stock comme un champ modifié en place (`ProduitStock.stock`, `types/index.ts:91`). Le PRD exige que le stock soit la somme de ses mouvements (FR-S11, FR-S13). Écart de fond, invisible à l'écran. Ce PRD l'inscrit comme condition de recette : aucun écran ne modifie un solde.
**Conséquences (testables) :** (1) recalculer le stock d'un article à partir de ses mouvements redonne exactement la valeur affichée ; (2) corriger un stock se fait par un ajustement avec motif (FR-S16), jamais par l'édition d'un nombre ; (3) la validation d'un inventaire (« Valider », `InventairePanel.tsx`) **produit** un ajustement, alors que la démo ne corrige rien (`AUDIT:58`) ; (4) un mouvement rejoué avec le même identifiant ne double pas le solde (FR-S14).

#### FR-200 : Lots, numéros de lot et dates limites : à créer
La démo ne connaît que la date limite par produit ; aucun numéro de lot. Les jus et boissons ont une date limite de consommation. Le PRD (FR-S17 à FR-S22) rend le suivi par lot activable article par article, avec règle d'écoulement « date limite la plus proche d'abord ».
**Conséquences (testables) :** (1) un article suivi par lot refuse une sortie sans lot ou propose le lot à la date limite la plus proche ; (2) l'écran de répartition par échéance (30, 60, 90 jours) donne la même quantité totale que le solde ; (3) un article non suivi par lot ne voit jamais de champ de lot ; (4) l'alerte de couverture supérieure au temps restant avant la date limite (FR-S22), évoquée dans `automation-journal.ts:143`, se déclenche sur un lot à écouler.

#### FR-201 : La valorisation du stock a une méthode, un exercice, une publication
La démo montre une valeur de stock « immobilisé » sans méthode. Le PRD exige CUMP par défaut, FIFO possible, méthode figée par exercice et publiée à la comptabilité (FR-S23 à FR-S34). La valeur de stock de l'écran doit porter la méthode et l'exercice.
**Conséquences (testables) :** (1) la valeur du stock affichée porte « CUMP, exercice 2026 » ; (2) changer de méthode en cours d'exercice est refusé (FR-S25) ; (3) `stock.valorisation.publiee@1` est émis à l'arrêté de l'exercice et la balance associée est acceptée ; (4) sans `balance`, la valeur est affichée avec la mention « non publiée » (C4).

#### FR-202 : Préparation, picking, camions, liquidation : ils vivent dans `entrepot` et `dashboard`, pas dans `stock`
La démo a des outils absents du PRD stock : préparation de commandes, vagues de picking, expéditions du jour, chargement des camions (poids, volume, palettes ; `expedition-engine.ts:148-202`), « Plan de liquidation » (`PlanLiquidationPanel.tsx:56`), « Journal d'automatisation » du réapprovisionnement (`automation-journal.ts:112-143`), coupure camion, affectation des préparateurs. Renvoi : préparation, picking, vagues, expédition, chargement, réception avec litige, contrôle au quai → module `entrepot` (partie 2) ; plan de liquidation et combos d'écoulement → `marketing` (combos) et `dashboard` (plan), à partir des signaux de `stock` (dormant, surstock) ; journal d'automatisation → `automatisations` ; réapprovisionnement → `approvisionnement`. `stock` reste la source des quantités et des alertes (`stock.alerte.changed@1`) et publie les faits que ces modules lisent.
**Conséquences (testables) :** (1) `stock` installé seul n'affiche ni onglet « Picking », ni « Camions », ni « Liquidation » ; (2) installer `entrepot` ajoute ces écrans sans modifier `stock` ; (3) le plan de liquidation d'un article s'appuie sur `stock.alerte.changed@1` et ne lit jamais la base de `stock`.

#### FR-203 : La réservation du stock s'active avec `commande`, pas avant
La démo dit elle-même qu'elle ne réserve pas (`PreparationPanel.tsx:277`, « le stock correspondant n'est pas réservé »). Le PRD prévoit `réservé` engagé par une commande non livrée (FR-S08, FR-S08c) et fixe `réservé = 0` en v1. Décision : la réservation est active **dès que `commande` est installé** et que la commande est validée ; sans `commande`, `réservé` est un emplacement déclaré `NON_INSTALLE`. À l'écran « disponibilité » du commercial, les trois états (disponible, limité, rupture) se calculent sur le **disponible** (physique − réservé), la quantité exacte n'étant montrée qu'à qui détient `stock:etat:consulter`.
**Conséquences (testables) :** (1) valider une commande de 40 unités sur un stock physique de 100 fait passer le disponible à 60 et laisse le physique à 100 ; (2) annuler la commande rend les 40 ; (3) le seuil « limité » est un paramètre de l'organisation, non du code ; (4) sans `commande`, la colonne `réservé` n'est ni 0 ni vide mais `NON_INSTALLE`.

#### FR-204 : Taux de service et ruptures sur trois mois : calcul hors `stock`
`StockView.tsx:186,339` montre le taux de service et `:189,408` les ruptures sur 3 mois ; le PRD stock n'a pas ces indicateurs. Ils combinent des lignes de commande servies ou non (`commande`, `entrepot`) et des alertes de rupture (`stock`) : ils sont produits par `dashboard`, qui les lit. 
**Conséquences (testables) :** (1) le taux de service est le quotient des quantités livrées sur les quantités commandées de la période, avec la formule affichée à côté du chiffre ; (2) sans `commande`, il affiche `NON_INSTALLE`, jamais 100 % ; (3) `stock` n'expose aucun champ de taux de service.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : emplacements, contraintes, capacités (FR-S02 à FR-S04) ; stock négatif (FR-S09) ; stock à une date passée (FR-S10) ; mouvement idempotent et ajustement avec motif et seuil de validation (FR-S14 à FR-S16) ; lots, FEFO, échéances (FR-S17 à FR-S22) ; valorisation et clôture d'exercice (FR-S23 à FR-S34) ; relevé du commercial contre estimation déduite (FR-S56 à FR-S60) ; droit de valorisation (FR-S61, FR-S62) ; audit (FR-S65). Pour février : mouvements, ajustement avec motif, stock à date, comptage d'ouverture (FR-10 de la Reprise), valorisation CUMP et lots à date limite sont exigés ; emplacements, FIFO et relevé du commercial sont `bientôt`. [ASSUMPTION : réduction de périmètre de février proposée par ce PRD, à confirmer par le PO.]

---

### 7.5 Paiement (`paiement`, M33) — PRD `prd-paiement-service-2026-08-02` + amendement 2026-09-21

**Ce que la démo montre et que le PRD couvre.** Créance et demande (FR-P13, FR-P13b) ; paiement partiel (FR-P25, FR-P26 ; `ComptabiliteComptableView.tsx:43`) ; promesse de paiement (FR-P28 à FR-P30 ; `RelancesView.tsx:509,607,647`) ; encaissement déclaré hors Prospera, espèces (FR-P31 à FR-P36 ; `ClotureVisiteModal.tsx:84`, `ExpeditionPanel.tsx:160-162`) ; rapprochement avec la remise d'espèces (FR-P33 ; `ComptabiliteComptableView.tsx:280-307`) ; lettrage et suspens (FR-P37 à FR-P39) ; ordres de paiement, c'est-à-dire le « run de paiement » du DAF (FR-P65 à FR-P69 ; `DashboardFinance.tsx:22-35`). Le manifeste `paiement` : `depends: []`, `enrichiPar: [notification, facturation]`, sept droits `paiement:*`, `objetsDeReprise: []`, domaine d'échange `paiement.encaissements`.

**Écarts à porter au PRD du module.**

#### FR-205 : Deux adaptateurs de paiement, PI-SPI et FedaPay ; FR-P10 est à mettre à jour
Décision du PO (2026-11-12) : les moyens de paiement du distributeur sont **PI-SPI et FedaPay**, plus espèces et virement déclarés. Le code livre déjà les deux derrière le contrat `PaymentProvider` : `src/adapters/api-business/` (identifiant `API_BUSINESS`, ordres sortants, relevé, QR interopérable) et `src/adapters/fedapay/` (cinq pays de la zone XOF, signature des notifications), avec routage par pays × devise × méthode (FR-P08). Le PRD est en retard : FR-P10 dit « FedaPay en développement ; le SPI BCEAO ou tout autre fournisseur est une configuration ». À amender : FR-P10 énonce « deux fournisseurs en service, PI-SPI (`API_BUSINESS`) et FedaPay (`fedapay`) » ; l'amendement du 2026-09-21 (FR-P65 à FR-P69) ajoute les ordres sortants sur le schéma interopérable. Le module s'appelle **`paiement`** : PI-SPI est un moyen de paiement, non un module ; le code `pi-spi` du catalogue est à déprécier.
**Conséquences (testables) :** (1) le routage d'une demande de 50 000 FCFA vers un payeur togolais retourne le fournisseur choisi par la configuration de l'organisation, et le journal le nomme ; (2) désactiver FedaPay dans la configuration de l'organisation laisse PI-SPI actif et inversement, sans déploiement ; (3) aucun écran du distributeur ne porte le mot « module PI-SPI » : le libellé est « Encaissements » ; (4) le manifeste `connecteurs` ne cite plus `pi-spi` (voir FR-218).

#### FR-206 : Le vocabulaire « Mobile Money » est corrigé
La démo ne cite ni PI-SPI ni FedaPay (aucune occurrence dans `src/` ni `docs/`). Elle dit « Mobile Money » (`MOBILE_MONEY`, `ESPECES`, `VIREMENT`, `ComptabiliteComptableView.tsx:25-34`), cite `TMONEY` et `FLOOZ` en références brutes (`comptable-registry.ts:35,48`) et promet dans sa documentation commerciale MTN MoMo, Airtel Money, M-Pesa, Orange Money et Wave (`prospera_annexe_distribution.md:163`), alors que pour le Togo T-Money et Flooz sont les seuls réels, et que ni FedaPay ni le schéma interopérable ne se pilotent par opérateur. Ce PRD exige : le **mode d'encaissement** d'une pièce prend ses valeurs dans `paiement` (`LIEN`, `ESPECES`, `VIREMENT`, `CHEQUE` [ASSUMPTION : le chèque de la démo est déclaré par l'utilisateur comme espèces et virement]) et le **fournisseur** est un champ distinct (`API_BUSINESS`, `fedapay`, ou `HORS_PROSPERA`) ; l'opérateur mobile n'est qu'une information du relevé du fournisseur.
**Conséquences (testables) :** (1) aucun écran ni aucun gabarit commercial n'affiche « MTN MoMo », « Airtel Money », « M-Pesa », « Orange Money » ni « Wave » pour une organisation togolaise (balayage des libellés) ; (2) un encaissement T-Money et un encaissement Flooz portent le même mode `LIEN` et deux opérateurs en information ; (3) le libellé « Mobile Money » est remplacé par « Paiement mobile » ou le mode précis.

#### FR-207 : L'écran du lien de paiement est à créer
Le « lien Mobile Money » envoyé avec la facture ou la relance (`prospera_annexe_distribution.md:152,165`, `prospera_distribution.md:202`) est le lien de paiement des FR-P14 à FR-P18 ; la démo n'a aucun écran. À créer : émission d'un lien depuis une facture ou un dossier de relance (montant, motif, frais affichés, durée de validité par défaut 30 jours, plafond 90 jours), partage par `notification` (WhatsApp, SMS, e-mail), suivi de l'état (émis, consulté, payé, expiré, révoqué), révocation avant paiement. La page publique du lien est consultable sans compte, sur téléphone modeste (NFR-8).
**Conséquences (testables) :** (1) depuis une facture de 120 000 FCFA, « Envoyer un lien » crée une demande, la transmet par `notification` et affiche l'état « émis » ; (2) payer le lien (bac à sable) marque l'encaissement constaté et réduit le solde de la facture sans action humaine ; (3) un lien expiré ou révoqué n'encaisse plus et le dit au payeur ; (4) en espace d'essai, aucun lien réel ni aucun message réel ne part (C13, point 6).

#### FR-208 : Les frais d'encaissement sont une politique du créancier, à montrer
La démo n'a aucune notion de frais (FR-P23, FR-P23b, FR-P23c, FR-P24b). Le distributeur est le créancier : il choisit qui supporte les frais (`payeur` par défaut, ou `bénéficiaire`, ou partage), figés à l'émission de la demande. L'écran de lien affiche montant dû, frais et total au payeur ; l'écran de paramètres du distributeur porte la politique.
**Conséquences (testables) :** (1) avec la politique `payeur`, un lien de 100 000 FCFA affiche montant dû, frais et total, et le total encaissé couvre les frais ; (2) changer la politique après émission ne modifie pas un lien déjà émis ; (3) le montant imputé à la facture est le montant dû, jamais le total frais compris.

#### FR-209 : Le « fichier banque » du run DAF est remplacé par des ordres de paiement
La démo parle d'un fichier banque et d'un export, « générer les ordres de virement » (`AUDIT:200,203`, `DashboardFinance.tsx:22`, `PilotageDAFView.tsx:15`). Un fichier téléversé à la banque ne passe pas par le fournisseur de paiement. L'amendement FR-P65 à FR-P69 prévoit des ordres **préparés** et **validés** par deux droits distincts et deux personnes, transmis par le fournisseur, dont l'issue vient du fournisseur et non d'une supposition (FR-P68). Décision de ce PRD : le run de paiement fournisseurs du DAF produit des ordres de paiement `paiement` (PI-SPI, ordres sortants) ; l'export d'un fichier banque est `bientôt` et n'est pas exigé en février. [ASSUMPTION : décision proposée, car aucune source ne tranche entre les deux mécanismes ; le PO le dit.]
**Conséquences (testables) :** (1) préparer un ordre et le valider sont deux droits distincts, et la même personne ne peut pas faire les deux (FR-P66) ; (2) un ordre rejeté par le fournisseur est terminal et un nouvel ordre se prépare (FR-P68) ; (3) l'écran du run affiche l'état du fournisseur, non un état présumé ; (4) le bouton « Générer le fichier banque » affiche `bientôt`.

#### FR-210 : Les modes et conditions de règlement d'une pièce sont séparés
Les modes de la démo `ESPECES`, `VIREMENT`, `CHEQUE`, `CREDIT_30J`, `CREDIT_45J`, `CREDIT_60J` (`types/index.ts:101`) mélangent des moyens d'encaissement et des conditions de crédit. Le PRD `paiement` ne traite que l'encaissement (FR-P31). Séparation : la **condition de règlement** (comptant, 30 j, 45 j, 60 j) appartient à `pdv` (FR-188) et `facturation` ; le **mode d'encaissement** (lien, espèces, virement, chèque) appartient à `paiement`.
**Conséquences (testables) :** (1) une facture « 45 jours » encaissée en espèces porte les deux : échéance à 45 jours et mode `ESPECES` ; (2) `paiement` ne contient aucun champ de condition de crédit (test de schéma) ; (3) les valeurs `CREDIT_30J`, `CREDIT_45J`, `CREDIT_60J` ne sont plus des modes d'encaissement.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : comptes d'encaissement (FR-P01 à FR-P06) ; webhook, idempotence, états (FR-P19 à FR-P22) ; délai de 48 heures ouvrées (FR-P34) ; import du relevé fournisseur (FR-P38) ; annulation constatée (FR-P49 à FR-P53) ; pays et devises (FR-P54 à FR-P58) ; journal opposable (NFR-4). Les droits d'abonnement et de suspension pour impayé (FR-P42 à FR-P48) n'ont pas d'objet côté distributeur. Pour février : compte d'encaissement, lien de paiement, frais, encaissement déclaré (espèces, virement), rapprochement et lettrage sont exigés ; les ordres de paiement sont exigés en lecture et en préparation, la transmission réelle est `bientôt` tant que le raccordement de l'organisation n'est pas fait. [ASSUMPTION : périmètre de février proposé par ce PRD.]

---

### 7.6 Notification (`notification`, M34) — PRD `prd-notification-service-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Canaux e-mail, SMS, WhatsApp (FR-N18) et repli « WhatsApp sinon SMS » (FR-N21 ; `RelancesView.tsx:40-45`) ; liste et envoi de masse (FR-N28, FR-N29 ; `MarketingView.tsx:61,160,382`) ; plafond d'envois (FR-N33 ; `garde-fous.ts:95-99`) ; envoi déclenché par événement et arrêt à l'encaissement (FR-N24 ; `recouvrement-automations.ts:356-367`) ; statuts et réponses (FR-N35 à FR-N39, FR-N41). Le manifeste `notification` : `depends: []`, `enrichiPar: []`, six droits, `objetsDeReprise: []`.

**Écarts à porter au PRD du module.**

#### FR-211 : Un client en défaut ou au crédit bloqué est exclu des campagnes ; la règle est de `marketing`
La démo exclut des campagnes un client en défaut ou au crédit bloqué (`garde-fous.ts:43-70`, `SEUIL_EXCLUSION_JOURS`). Le PRD notification gère le consentement et le désabonnement (FR-N46 à FR-N50), non la solvabilité, et il ne connaît aucune donnée métier (FR-N05). La règle est donc posée ici, appliquée par **`marketing`** à la constitution de l'audience : exclusion si la créance la plus ancienne dépasse `SEUIL_EXCLUSION_JOURS` (paramètre du distributeur, publié par `recouvrement`) ou si le crédit est bloqué (FR-189). `notification` n'en reçoit que la liste finale. Les messages transactionnels (relance, facture, lien de paiement) ne sont **pas** concernés : le refus de la publicité n'éteint pas une mise en demeure (FR-N26, FR-N50), et l'inverse vaut (un client en défaut reçoit sa relance).
**Conséquences (testables) :** (1) sur le jeu de test, un client en défaut à 45 jours est retiré d'une campagne promotionnelle et reste destinataire de sa relance ; (2) la fiche de campagne affiche le nombre de clients exclus et le motif, sans nommer ; (3) sans `recouvrement` et sans `facturation`, l'exclusion est « non évaluée » et la validation d'un envoi de masse demande une confirmation explicite plutôt que d'envoyer à tous en silence ; (4) un client exclu n'apparaît jamais dans la liste remise à `notification` (le test lit la liste, non l'écran).

#### FR-212 : Le plafond de deux messages par client et par semaine est par destinataire
La démo plafonne à `QUOTA_MESSAGES_SEMAINE = 2` messages par **client** et par semaine (`garde-fous.ts:95-99`). FR-N33 plafonne par organisation et par période. À amender dans le PRD notification : un plafond **par destinataire** et par période, sur la nature « campagne » seulement (les messages transactionnels en sont exemptés). Le décompte appartient à `notification` (qui connaît le carnet de contacts, FR-N01 à FR-N08) ; la valeur est un paramètre de l'organisation, 2 par semaine par défaut pour le distributeur.
**Conséquences (testables) :** (1) un destinataire qui a reçu 2 messages de campagne dans la semaine reçoit un refus nommé au troisième, sans envoi ; (2) la même personne reçoit sa relance dans la même semaine ; (3) la valeur se règle sans déploiement ; (4) le refus est compté dans le journal d'envoi.

#### FR-213 : La file d'envoi hors réseau du terrain est dite
La démo met une proforma WhatsApp en file quand le terrain est hors réseau (`ProformaBuilder.tsx:334`). `notification` n'a pas de file côté appareil. Règle : la file est **dans l'application terrain** (`terrain`, avec FR-V25b) ; à la reconnexion, l'appareil envoie la demande d'envoi, qui est idempotente (identifiant d'envoi), et `notification` répond avec l'accusé. Un message n'est jamais présenté « envoyé » avant l'accusé de `notification`.
**Conséquences (testables) :** (1) hors réseau, la proforma affiche « en attente d'envoi » et non « envoyée » ; (2) à la reconnexion, un seul envoi part même si l'appareil réessaie deux fois ; (3) une proforma mise en file puis annulée avant la reconnexion ne part pas.

#### FR-214 : Les écrans de modèles, d'aperçu, de journal d'envoi et de consommation sont à créer
Le module d'écran de `notification` n'existe pas dans la démo : ni modèles (FR-N09 à FR-N16), ni aperçu avant envoi (FR-N15 ; l'audit le demande, `AUDIT:228`, « Preview WhatsApp/SMS avant envoi »), ni journal d'envoi (FR-N35 à FR-N39), ni consommation (FR-N57 à FR-N63). Le « Social studio » (publication Meta et TikTok, inbox : `marketing/social/page.tsx`) est un consommateur (FR-N44), mais la file de publication et l'OAuth Meta ne sont dans aucun PRD de la liste : ils sont portés par `studio-social` (partie 2). Les canaux `IMPRESSION`, `CHATBOT`, `TERRAIN` et `APPEL`/`VISITE` de la démo ne sont pas des canaux d'envoi : ils restent à `facturation`, `marketing` et `recouvrement`.
**Conséquences (testables) :** (1) un modèle de relance se rédige, se prévisualise avec les valeurs d'un client du jeu de test et se publie avant tout envoi ; (2) le journal d'envoi donne, pour un message, l'état parmi livré, échoué, lu, avec l'heure ; (3) un modèle WhatsApp non approuvé ne peut pas être sélectionné ; (4) en espace d'essai, l'envoi est intercepté et compté (C13, point 6).

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : carnet de contacts (FR-N01 à FR-N08) ; modèles, versions, langues, approbation WhatsApp (FR-N09 à FR-N16) ; lots avec reprise et interruption (FR-N30 à FR-N32) ; validation avant envoi de masse à deux personnes (FR-N34 ; la validation DG d'un combo à remise de 12 % ou plus dans `combo-stock-workflow.ts:7,29` n'est pas cette validation) ; rejeu (FR-N40) ; consentement, désabonnement, droits des personnes (FR-N46 à FR-N52) ; mesure de consommation (FR-N57 à FR-N63) ; rétention (FR-N64 à FR-N68). Pour février : modèles, aperçu, journal, désabonnement et consentement sont exigés ; la validation à deux personnes de l'envoi de masse l'est aussi ; rejeu et mesure de consommation sont `bientôt`.

---

### 7.7 Reprise de données (`reprise`, M44) — PRD `prd-reprise-donnees-2026-11-10`

**Ce que la démo montre et que le PRD couvre.** Le périmètre du distributeur (Reprise FR-9) : points de vente, produits et prix société et freelance, créances ouvertes, commerciaux, fournisseurs, stock d'ouverture ; historique des ventes et des paiements. Export Sage en fichier (Reprise FR-1, gabarit Sage ; février = fichiers seulement). Libre-service prêt en février, y compris pour un prospect en essai (Reprise FR-19). Comptage d'ouverture (Reprise FR-10). Le manifeste `reprise` : `depends: []`, `enrichiPar: [pdv, catalogue, reseau, stock, facturation, assurance, sinistres]`, six droits `reprise:*`.

**Écarts à porter au PRD du module.**

#### FR-215 : L'écran d'import en libre-service est entièrement à créer
La démo n'a aucun téléversement, aucune correspondance de colonnes, aucun rapport avant import ; seul `RapportExportBar.tsx:4` exporte en CSV et PDF. Reprise FR-19 exige un libre-service prêt en février. Écran à créer, accessible au détenteur de `reprise:lot:importer` : dépôt de fichiers (modèles Sage téléchargeables), correspondance de colonnes, **simulation** (rapport sans écriture, par le module cible), correction des lignes rejetées, doublons à fusionner (Reprise FR-12), valeurs de contrôle (écart nul, Reprise FR-15), feu vert par module cible puis application. Le comptage d'ouverture du stock a son écran propre (Reprise FR-10).
**Conséquences (testables) :** (1) sur le jeu « Grossiste du Golfe », un fichier de clients de 300 lignes dont 6 invalides produit un rapport avec 294 lignes valides et 6 rejets citant la ligne et le motif, **sans rien écrire** ; (2) appliquer le lot crée 294 points de vente et la somme des plafonds égale la valeur de contrôle ; (3) rejouer le même lot ne crée aucun doublon ; (4) un utilisateur sans `reprise:lot:valider` ne peut pas donner le feu vert ; (5) l'écran est ouvert dans l'essai du prospect.

#### FR-216 : Les objets de reprise du distributeur et leur module cible
La reprise de février doit amener : le fichier clients avec conditions de paiement et plafonds de crédit ; les articles et tarifs, y compris les prix propres à chaque client ; les factures impayées à la bascule ; la suite de numérotation des factures de Sage. Le module cible de chacun, d'après la spine de la Reprise (AD-23), les manifestes et les parties 2 et 3 de ce PRD :

| Objet du client | Module cible | Objet de reprise | État |
|---|---|---|---|
| Commerciaux (personnes à inviter, zones) | `reseau` | `reseau.commercial@1`, `reseau.zone@1` | Prêt. Les comptes naissent par invitation SMS (STORY-900, auth-service) |
| Fichier clients, GPS, commercial titulaire | `pdv` | `pdv.point-de-vente@1`, `pdv.affectation@1` | Prêt ; doublons par téléphone puis proximité (FR-V06) ; pipeline non repris |
| Plafond de crédit par client | `pdv` | `pdv.point-de-vente@1` (valeur de contrôle : montant, ou `PLAFOND_SANS_OBJET`) | Prévu (FR-V30) |
| Conditions de paiement par client | `pdv` | `pdv.point-de-vente@1` | **Écart** : exigence FR-188 à porter au PRD pdv |
| Articles (référence, conditionnement, unité, taxe) | `catalogue` | `catalogue.article@1` | Prêt ; conditionnement en texte libre traduit par le gabarit, jamais inventé |
| Tarifs société et catégorie freelance | `catalogue` | `catalogue.grille@1` | Prêt ; le prix que le freelance pratique n'est jamais repris (FR-C29) |
| Prix négociés par client | `catalogue` | `catalogue.grille@1` avec condition « point de vente » | **Écart** : FR-193 à porter au PRD catalogue |
| Stock d'ouverture | `stock` | `stock.point-de-stock@1`, `stock.stock-ouverture@1` | Prêt ; feu vert propre (comptage clos) |
| Factures impayées à la bascule | `facturation` | `facturation.facture-ouverte@1` | **Proposé** : objet à déclarer au manifeste `facturation` (partie 2) ; `paiement` ne porte pas la créance reprise (`objetsDeReprise: []`) |
| Suite de numérotation des factures de Sage | `facturation` | `facturation.suite-numerotation@1` | **Proposé** (voir FR-217) |
| Fournisseurs | `approvisionnement` | `approvisionnement.fournisseur@1` | **Proposé** ; module non codé, « non installé » s'il manque en février |
| Historique des ventes et des paiements | à confirmer | aucun | Pas de cible : graphiques « Évolution CA 6 mois » (`PdvRapportView.tsx:134`) en dépendent ; question ouverte |

**Conséquences (testables) :** (1) chaque ligne « Prêt » est rejouable sur le jeu de test avec valeur de contrôle égale ; (2) la Reprise livre dans l'ordre : `reseau`, puis `pdv` et `catalogue`, puis `stock` ; `facturation` en dernier, car une facture ouverte référence un client et un article ; (3) une cible absente donne un écart « module non installé » au rapport, pas une erreur ; (4) la balance clients du premier jour est égale, à l'unité de FCFA, à la somme des factures impayées du fichier Sage (valeur de contrôle « reste dû »).

#### FR-217 : La suite de numérotation des factures de Sage reprend sans trou ni doublon
Aucune occurrence de « numérotation » ni de « suite de numéros » dans la spine de la Reprise, le PRD reprise ni les manifestes. Dans la démo les numéros sont `FAC-2026-8821` (`factures-registry.ts:40`) : une suite par année. Exigence nouvelle : le **dernier numéro émis sous Sage** est repris comme valeur de départ du compteur de `facturation` (par série : facture, avoir, proforma) ; la première facture Prospera porte le suivant ; **aucun trou et aucun doublon**, y compris sous deux saisies simultanées. Le compteur appartient au seul module `facturation` (point d'écriture unique), et le lot de reprise est le seul à pouvoir l'initialiser, une fois.
**Conséquences (testables) :** (1) reprise du dernier numéro `FAC-2026-8821` : la première facture émise s'appelle `FAC-2026-8822` ; (2) 50 factures émises en parallèle reçoivent 50 numéros consécutifs distincts ; (3) une annulation ne libère pas son numéro, elle émet un avoir ; (4) réimporter une seconde suite de numérotation après la première facture Prospera est refusé avec un code nommé ; (5) le format du numéro est un paramètre (préfixe, année, largeur), repris du fichier Sage, non du code. [ASSUMPTION : le format exact des numéros Sage du client de février n'est pas connu ; à obtenir avec l'export des factures ouvertes.]

**Ce que le PRD exige et que la démo ne montre pas.** Tout le reste est à créer : provenance de chaque donnée (Reprise FR-2) ; fichiers (Reprise FR-3) ; états valides (Reprise FR-5) ; dates d'origine (Reprise FR-6) ; montants à saisir (Reprise FR-7) ; doublons (Reprise FR-12) ; droit de valider attribué par le DG seul (Reprise FR-13) ; livraison (Reprise FR-14) ; écart nul et feu vert par module (Reprise FR-15) ; marche en parallèle (Reprise FR-17) ; Reprise FR-21 et Reprise FR-22. L'historique des ventes (partie « historique protégé » de Reprise FR-9) n'a pas de cible : voir la question ouverte OQ-4-5.

---

### 7.8 Connecteurs (`connecteurs`, M43) — PRD `prd-connecteurs-2026-11-10`

**Ce que la démo montre et que le PRD couvre.** Rien à l'écran. La démo ne montre aucune frontière entre ce que Prospera possède et ce que le logiciel du client possède ; seul le texte « Intégration Odoo » existe (`prospera_pricing_distribution.md:27`), sans écran. Le PRD Connecteurs (Connecteurs FR-14 : distributeur et Odoo) fixe un propriétaire par domaine : points de vente, visites, commandes terrain = Prospera ; encaissements terrain (Mobile Money, espèces) = Prospera ; produits et prix, stock, créances ouvertes, fournisseurs = Odoo si le client le garde ; commerciaux = Prospera. Le manifeste `connecteurs` : `depends: []`, `enrichiPar: [reprise, pdv, catalogue, stock, facturation, pi-spi, approvisionnement]`, quatre droits `connecteurs:*`, `domainesEchange: []`.

**Écarts à porter au PRD du module.**

#### FR-218 : Connecteurs est hors février ; l'export vers Sage vient après
Amendement du 2026-11-12 (spine de Connecteurs, AD-32) : Connecteurs est hors février. Décision du PO, même jour : l'export vers Sage se fera **après** février ; pour février, le projet est démontrable avec de vraies données de test et des parcours concrets. Conséquences pour ce PRD : aucun bouton de la démo ne promet une intégration ; « Intégration Odoo », « Export Sage » et « Télédéclarer sur le portail OTR » affichent `bientôt` ; les modules de la partie 2 déclarent leurs `domainesEchange` dès le manifeste (facturation, encaissements) pour que le passage futur ne les oblige pas à une reprise de code (règle du point d'écriture unique par domaine, contrat §6). Le manifeste `connecteurs` cite `pi-spi` dans `enrichiPar` : le module s'appelle `paiement` (FR-205), et la ligne est à corriger.
**Conséquences (testables) :** (1) aucun écran du distributeur ne déclenche un échange avec un logiciel externe en février ; (2) la section « Intégrations » du menu n'apparaît que si `connecteurs` est installé ; (3) un domaine d'échange déclaré (par exemple `facturation.factures`) a une seule fonction d'écriture de service, vérifiée par la suite de conformité ; (4) `connecteurs.enrichiPar` ne contient plus `pi-spi`.

#### FR-219 : Contradiction de source : le logiciel quitté est-il Sage ou Odoo ?
Le brain dump du PO et le PRD Reprise disent que le client de février **quitte Sage**. La documentation commerciale classe le même client « Odoo complet » (`prospera_pricing_distribution.md:16`) et dit que les distributeurs togolais ont déjà un CRM ou un ERP, souvent Odoo (`:6`). Hypothèse de travail de ce PRD : **Sage**, donc aucun connecteur Odoo en février (déjà acté par AD-32) et une reprise par fichiers au gabarit Sage (Connecteurs FR-1). Si c'était Odoo, la ligne Connecteurs FR-14 de Connecteurs repasserait en jeu et le périmètre de février changerait (étapes 1 à 3 de Connecteurs FR-17). La question est ouverte (OQ-4-1) et doit être tranchée avant la validation du lot.
**Conséquences (testables) :** (1) le gabarit de reprise livré en février est celui de Sage ; (2) aucun test de recette ne suppose Odoo ; (3) la réponse du PO, quelle qu'elle soit, est notée dans ce chapitre avec sa date, et la fiche reprise est mise à jour dans la même PR.

**Ce que le PRD exige et que la démo ne montre pas.** Tous les écrans de Connecteurs sont à créer et sont hors février : configuration du logiciel du client (4.A), échanges et file des écarts (4.B, 4.C), panne du lien (4.D), ordre de livraison du connecteur Odoo (4.F). Un seul écran est utile dès que le premier domaine existera : l'état **« lecture seule, propriété du logiciel externe »**, qui bloque l'édition d'un objet dont le client a gardé la propriété (enveloppe `<ProtectionObjet>`) ; la démo ne le prévoit pas, et ce PRD l'inscrit pour le module d'écran de chaque domaine d'échange.

---

### 7.9 Questions ouvertes de la partie 4

| # | Question | Pour qui | Lien |
|---|---|---|---|
| OQ-4-1 | Le client de février quitte-t-il Sage ou Odoo ? Les sources se contredisent. | PO | FR-219 |
| OQ-4-2 | Qui produit le score de santé le premier jour : `dashboard` (règles) ou un module de scoring différé ? | PO | FR-184 |
| OQ-4-3 | Le « fichier banque » du run DAF est-il remplacé par des ordres `paiement`, ou gardé en plus ? | PO | FR-209 |
| OQ-4-4 | `montant_client` est-il vraiment exposé au DG dans la vue de commande ? À mesurer sur la démo avant la recette. | Dev B | FR-195 |
| OQ-4-5 | Quel module reçoit l'historique des ventes et des paiements par client ? | PO | FR-216 |
| OQ-4-6 | Les écrans de `reseau`, `pdv`, `catalogue` et `stock` réduits pour février (marqués « bientôt ») sont-ils acceptables ? | PO | 7.1 à 7.4 |
| OQ-4-7 | Le format des numéros de facture Sage, et le dernier numéro émis. | PO / client | FR-217 |

---

---

## 8. Exigences transverses

- **NFR-1, rien ne se perd.** Une action confirmée à l'écran est enregistrée ; perte maximale d'une heure de données en cas de panne de la plateforme, comme le reste de Prospera.
- **NFR-2, l'argent est exact.** Les montants sont en unités entières de la devise (XOF sans décimale) ; la TVA se calcule sur le HT ligne par ligne, avec une règle d'arrondi unique et écrite. Aucun taux n'est codé en dur : la TVA vient du paquet fiscal du pays (18 % au Togo).
- **NFR-3, la numérotation ne ment pas.** Factures, avoirs et bons de livraison suivent chacun une suite continue par organisation, sans trou ni doublon, même sous des saisies simultanées.
- **NFR-4, sécurité.** Authentification réelle par le socle (aucun mot de passe dans le code) ; périmètres appliqués par le serveur (FR-5, FR-6) ; aucun secret dans les écrans ; un téléphone perdu peut être déconnecté à distance.
- **NFR-5, traçabilité.** Toute action sur l'argent, le stock, un garde-fou ou une décision est journalisée : qui, quoi, quand, avant, après. Le journal ne se modifie pas.
- **NFR-6, hors connexion.** L'application terrain fonctionne sans réseau pendant une journée de tournée ; au retour du réseau, rien n'est perdu et rien ne compte deux fois.
- **NFR-7, performance.** Sur le grand jeu (FR-10) : une liste de 2 000 points de vente s'affiche en moins de 2 s ; une facture se crée en moins de 1 s ; l'application terrain démarre en moins de 5 s sur un Android à 2 Go `[ASSUMPTION]`.
- **NFR-8, langue.** Tout le produit est en français ; les montants s'écrivent « 35 000 F » ; les dates au format jj/mm/aaaa.
- **NFR-9, hébergement.** Le client de février est hébergé chez Money Vibes ; chaque module suit la règle des 7 jours de retour arrière (contrat, C12).

---

## 9. Indicateurs de réussite

**Principaux**
- **SM-1, les deux moments.** Un prospect joue UJ-1 et UJ-2 de bout en bout, seul, sur le vrai serveur, dans son essai. Cible : 100 % des essais du 15/01 ; aucun blocage. Valide FR-1, FR-9, et les parties 2 et 3.
- **SM-2, zéro bouton qui ment.** 100 % des boutons d'action sont `BRANCHÉ` ou `BIENTÔT` ; 0 bouton simulé. Valide FR-2.
- **SM-3, la facture juste.** Sur le grand jeu : 0 trou et 0 doublon de numéro ; 100 % des factures avec TVA = 18 % du HT au franc près. Valide FR-11, NFR-2, NFR-3.
- **SM-4, la tournée finie.** Une visite clôturée hors connexion apparaît chez le superviseur moins d'une minute après le retour du réseau, sans doublon d'encaissement. Valide NFR-6 et la partie 3.

**Secondaires**
- **SM-5, chiffres vrais.** 0 indicateur constant (vérifié par un test qui modifie une donnée et attend que l'indicateur bouge). Valide FR-15.
- **SM-6, périmètres étanches.** 0 donnée hors périmètre rendue, sur une suite qui essaie chaque rôle contre chaque écran et chaque route. Valide FR-5, FR-6, FR-8.
- **SM-7, le client de février prêt.** La liste de ses besoins du premier jour (brain dump, §2) est jouée sur son jeu de reprise avant la mise en service. Valide les modules ★.

**Contre-indicateurs (à ne pas optimiser)**
- **SM-C1, nombre d'écrans branchés.** Brancher vingt écrans à moitié vaut moins que deux parcours de bout en bout. Contrebalance SM-2.
- **SM-C2, quantité d'« IA » affichée.** Afficher plus de scores sans provenance ni justesse dégrade la confiance. Contrebalance FR-16.

---

## 10. Périmètre

### 10.1 Dans le périmètre

Tout ce que la démo présente (20 modules, en 4 familles), en vrai, selon les parties 2, 3 et 4. `[ASSUMPTION: ordre de livraison proposé, à valider par le PO : (a) d'abord les deux parcours n° 1, les rôles et périmètres, le jeu de démonstration et les modules ★ (commande, facturation, encaissements, relances, points de vente, catalogue, stock) ; (b) puis terrain hors connexion, entrepôt, approvisionnement, conquête ; (c) puis le pilotage, le marketing, le studio, les automatisations et le contrôle de gestion. Ce qui n'est pas livré est « bientôt », jamais simulé.]`

### 10.2 Hors périmètre pour l'instant

- **Export vers Sage** (factures et paiements importables par Sage) : après, décision du PO.
- **Facture normalisée et certification OTR** : non exigées pour février ; les e-factures sont « bientôt ».
- **Télédéclaration OTR** : module `declarations`.
- **Connecteur Odoo** : module `connecteurs`, hors février.
- **Compte-rendu vocal, assistant conversationnel** : « bientôt ».
- **Consignes de bouteilles et de casiers** `[ASSUMPTION]` : hors v1 (question ouverte n° 4).

---

## 11. Non-objectifs

- Prospera Distributeur **n'est pas un logiciel de comptabilité générale** : il produit les écritures depuis ses factures et ses encaissements ; il ne remplace pas un cabinet.
- Prospera **ne détient jamais les fonds** : le distributeur encaisse sur son compte, chez son fournisseur de paiement.
- Les points de vente **n'ont pas de compte** en v1.
- Aucune règle n'est écrite pour un client nommé : tout ce qui varie d'un distributeur à l'autre est un paramètre (contrat, C6).

---

## 12. Questions ouvertes

1. **Taille du client de février** : nombre de commerciaux, de points de vente, de factures par mois, d'entrepôts (prochain rendez-vous).
2. **Sage ou Odoo ?** La grille tarifaire (`prospera_pricing_distribution.md`, ligne 16) classe le client de février « Odoo complet » ; le PO dit qu'il quitte Sage. Ce PRD suit le PO.
3. **L'offre** : la grille de prix vend « 10 modules » à 53 M (profil Grand), le document modules/bundles « 18 modules » au même prix ; la somme des 4 bundles (57,3 M) dépasse la plateforme complète ; le contrôle de gestion n'est dans aucun bundle. À trancher commercialement.
4. **Consignes** de bouteilles et de casiers : le client de février en gère-t-il ? Un casier rendu n'est ni un avoir ni un paiement.
5. **Format du numéro de facture** et reprise de la suite Sage : à confirmer sur un export Sage réel.
6. **Mentions légales de la facture** au Togo (NIF, RCCM, régime, pénalités de retard) : à valider par l'expert-comptable.
7. **Tranches de la balance âgée** : la démo en a deux versions (4 et 5 tranches) ; les parties 2 et 3 retiennent 5 tranches paramétrables.

**Décisions bloquantes à prendre par le PO avant l'architecture** (issues de l'assemblage) :

8. **Qui porte la Créance ?** Proposition de la partie 3 : un seul registre, tenu par `paiement` (qui a déjà la créance projetée et le solde), ouvert par sa source (facture, échéance de prêt, prime), lu par `recouvrement`. Demande un amendement du PRD paiement (tiers, source, périmètre).
9. **Quand naît la facture ?** Proposition de la partie 2 : à la livraison, sur les quantités réellement servies ; autre choix : à la validation de la commande.
10. **La numérotation des factures** : une suite continue d'année en année ou remise à zéro chaque année ? Une seule série par organisation (proposé) ou une par entrepôt ou par canal ? Elle reprend le dernier numéro Sage à la bascule.
11. **Le freelance** : qui facture le détaillant final (le freelance, hors du système, proposé) ? Une commission lui est-elle versée par la société ? Bloque FR-96 et FR-98.
12. **Le blocage du crédit** : à plus de 60 jours ou au-delà du plafond (proposé), J+30 devenant une alerte à la direction ; ou dès J+30 comme dans l'écran des relances de la démo.
13. **Le périmètre de février des modules déjà cadrés** : la partie 4 propose de marquer « bientôt » une part des écrans de `reseau`, `pdv`, `catalogue` et `stock` (OQ-4-6).
14. **Les dates des boutons « bientôt »** et l'ordre de livraison du §10.1.

---

## 13. Hypothèses

*Toutes les marques `[ASSUMPTION]` du document, à confirmer :*

- §4.3 FR-9 : catalogue du jeu de 60 à 80 articles en 5 familles.
- §4.3 FR-10 : chargement d'une taille en moins de 10 minutes.
- §8 NFR-7 : seuils de performance.
- §10.1 : ordre de livraison en trois temps.
- §10.2 : consignes hors v1.


**Partie 2**

-  : calendrier du plan v3 : démo le 15/01/2027, client de février en février 2027 ; toute date « bientôt » est à confirmer par le PO.
- 5.1 Commande (`commande`, M08) ★ : `TRANSMISE` est ajouté aux 5 statuts de la démo ; le brouillon `BROUILLON` de la démo n'était jamais produit.
- FR-30 : Créer une commande au bureau : « dans la minute » sert de critère de test.
- FR-31 : Ligne de commande typée et prix figé : le seuil de la démo pour les combos est 12 % ; il est repris comme valeur par défaut de ce garde-fou.
- FR-33 : Valider une commande avec contrôles : règle de la démo, `picking-engine.ts:36-45`, reprise comme valeur par défaut paramétrable.
- FR-33 : Valider une commande avec contrôles : rôles autorisés à déroger = DG et DAF.
- FR-34 : Réserver le stock à la validation : N = 7 jours, paramètre. Décision à trancher : expiration automatique ou non.
- FR-36 : Produire le bon de livraison : la preuve de livraison de février est une photo du bon signé ; la signature à l'écran est « bientôt ».
- FR-38 : Commande WhatsApp : dépend du connecteur WhatsApp du module `notification`.
- FR-39 : Prix société, prix freelance et marge : la démo se contredisait ; le responsable stock n'a pas ce droit dans `perimetre-logistique.ts`, on l'applique aussi au catalogue.
- FR-41 : Livraison partielle et reliquat : 15 jours, paramètre.
- FR-41 : Livraison partielle et reliquat : option A, car B multiplie les catégories pour un client de plusieurs centaines de prix négociés.
- FR-41 : Livraison partielle et reliquat : par défaut à la livraison, sur les quantités servies (FR-42), paramétrable.
- FR-41 : Livraison partielle et reliquat : les consignes sont hors v1.
- FR-41 : Livraison partielle et reliquat : une adresse, celle du point de vente.
- FR-42 : Créer la facture depuis la commande, en un clic : facturation à la livraison par défaut ; une option par organisation permet de facturer dès `VALIDEE`.
- FR-42 : Créer la facture depuis la commande, en un clic : la saisie manuelle sert à la reprise et aux ventes comptoir.
- FR-43 : Numérotation continue qui reprend la suite de Sage : le format exact de Sage est inconnu ; il est saisi à la bascule d'après la dernière facture Sage. Exemple de test : dernier numéro Sage `FAC-2026-0412`, premièr…
- FR-43 : Numérotation continue qui reprend la suite de Sage : continue, avec l'année dans le format. À valider par l'expert-comptable du client.
- FR-44 : Mentions légales sur chaque facture : la liste exacte des mentions obligatoires au Togo est à faire valider par l'expert-comptable du client avant le 20/11 ; la liste ci-dessus est celle de la démo …
- FR-45 : Montants exacts : taux unique à 18 % en février ; la démo ne gère ni multi-taux ni exonération.
- FR-46 : Imprimer et télécharger la facture en PDF : 10 ans.
- FR-47 : Envoyer la facture au client : e-mail disponible en février ; WhatsApp et SMS dépendent de `notification`.
- FR-48 : Émettre un avoir : l'avoir n'entre jamais le stock tout seul.
- FR-48 : Émettre un avoir : seuil paramétrable, 500 000 XOF par défaut.
- FR-49 : Facture, Créance et paiements partiels : l'excédent n'est pas géré en février.
- FR-51 : Balance âgée : 5 tranches, comme la version « comptable » de la démo ; la version des relances n'en avait que 4. Décision à trancher.
- FR-52 : Encours, plafond de crédit et conditions de règlement par client : ces plafonds sont du texte libre dans la démo ; ils ne sont repris que comme suggestions modifiables.
- FR-58 : Reprendre les factures impayées à la bascule : nom et version à fixer au manifeste, `facturation.facture-ouverte@1`
- FR-58 : Reprendre les factures impayées à la bascule : `facturation` émet les factures et la suite de numérotation ; la Créance est l'objet commun de la partie 3, alimenté par `facturation` et réduit par `paiement`.
- FR-58 : Reprendre les factures impayées à la bascule : une série par organisation en février, pour garder « sans trou ni doublon » simple à contrôler.
- FR-58 : Reprendre les factures impayées à la bascule : oui, FR-42.
- FR-59 : Registre des fournisseurs : la démo ne l'excluait pas du choix.
- FR-59 : Registre des fournisseurs : alerte, pas blocage ; la démo l'écrit en spécification sans le contrôler.
- FR-61 : Réapprovisionnement proposé automatiquement : on garde le déclenchement de la démo.
- FR-62 : Commande fournisseur, de SUGGEREE à RECUE : 7 jours, paramètre.
- FR-63 : Plafonds de validation par montant : séparation des tâches ; à valider avec le client.
- FR-64 : Plancher de trésorerie qui bloque : décision à trancher : bloquer ou avertir quand la trésorerie est inconnue.
- FR-67 : Dette fournisseurs et échéancier : elle est incluse ici ; la démo n'en avait pas alors que la spécification v2 la demande.
- FR-67 : Dette fournisseurs et échéancier : XOF seulement.
- FR-68 : Préparer les commandes (picking) : accord du bureau obligatoire ; la démo ne dit pas qui accepte.
- FR-69 : Vagues et charge du jour : création, modification, absence ; la démo les codait en dur.
- FR-72 : Litiges de réception : 15 jours, paramètre.
- FR-73 : Inventaire tournant par classe ABC : comptage « en aveugle » ; la démo affichait le théorique.
- FR-74 : Un inventaire validé corrige le stock : pas de gel du stock ; l'écart est ajusté des mouvements intermédiaires. Décision à trancher.
- FR-75 : Poste du magasinier et périmètre : Grossiste du Golfe a 2 entrepôts, des emplacements, et des lots à date limite pour les jus.
- FR-76 : Zones non couvertes et recensement : la carte utilise Google Maps, choix du PO pour le module `pdv`.
- FR-76 : Zones non couvertes et recensement : règle de proximité du module `pdv`, 30 m à confirmer.
- FR-77 : Carnet de prospects : la démo saisit le score à la main, sans formule ; on l'affiche seulement s'il est calculé.
- FR-80 : Créer l'ouverture à la première commande livrée : méthode d'imputation à définir avec le contrôle de gestion ; la démo stocke une valeur.
- FR-84 : Objectifs par zone, par commercial et par point de vente : avertissement et non blocage.
- FR-84 : Objectifs par zone, par commercial et par point de vente : format du fichier à définir.
- FR-86 : Mix produit, marge et distribution numérique : le responsable des ventes, à la main, avec motif.
- FR-86 : Mix produit, marge et distribution numérique : écart de la démo (`/equipe`) à corriger dans la partie 3.
- FR-87 : Calendrier des publications : droit de lecture seule du DG, comme dans la démo (`route-access.ts:47`).
- FR-88 : Accroches proposées : module `assistant` (assistant-service) branché plus tard ; en février, gabarits.
- FR-90 : Boîte de réception unique : dépend des connecteurs WhatsApp Business, Meta et TikTok.
- FR-92 : Créer un lead qui devient un prospect : les messages sont conservés 12 mois.
- 5.7 Add-on Réseau Freelance (`freelance`, M42) : voir FR-98.
- FR-93 : Double tarification : la grille société est intouchable : avertir sans bloquer, comme la démo.
- FR-95 : Portefeuille isolé : règle du module `pdv`.
- FR-95 : Portefeuille isolé : décision à trancher : la société sait-elle quels détaillants le freelance sert ?
- FR-96 : Commande à double flux : la facturation du freelance à ses détaillants est hors périmètre de février. Question ouverte au PO : qui facture le détaillant final ?
- FR-98 : Commissions et reversements : option désactivée par défaut ; décision à trancher avec le PO.
- FR-99 : Classements séparés et activation de l'add-on : crédit avec plafond propre, comme tout client.
- FR-99 : Classements séparés et activation de l'add-on : non.
- FR-99 : Classements séparés et activation de l'add-on : non en v1.

**Partie 3**

-  : toute cellule IMF ou assurance est à confirmer par le PRD de sa verticale.
- 6.1 Terrain et application mobile (`terrain`, M12) : chez l'IMF, la collecte d'épargne et le remboursement de prêt sont deux sortes d'Encaissement portées par `paiement` ; le noyau Terrain ne les distingue pas.
- FR-106 : Carte de l'équipe : consentement et durée de conservation à valider avec la réglementation de protection des données.
- FR-110 : Appareil perdu, session sûre : la politique exacte (effacement, délai de grâce hors connexion) est à fixer avec le PO.
- FR-110 : Appareil perdu, session sûre : Google Maps pour la carte de l'équipe et la navigation, comme sur le PRD réseau ; l'OpenStreetMap de la démo n'est pas repris.
- FR-110 : Appareil perdu, session sûre : la prospection par pointage GPS (recensement) vit dans le module `conquete-objectifs` (FR-76) ; elle utilise la même application.
- 6.2 Relances et recouvrement (`recouvrement`, M19) : raisons : (a) `paiement` est déjà codé et calcule déjà le solde ; (b) `facturation` a besoin du reste dû même sans `recouvrement` (FR-49) ; (c) `recouvrement` s…
- 6.2 Relances et recouvrement (`recouvrement`, M19) : un dossier par tiers évite de relancer trois fois le même client pour trois factures ; le dossier par créance reste possible en paramètre.
- 6.2 Relances et recouvrement (`recouvrement`, M19) : chez l'IMF, le PAR et les pénalités de retard sont réglementés. Le noyau ne calcule ni pénalité ni intérêt de retard ni classement réglementaire : la Source `EC…
- FR-114 : Échelle d'escalade paramétrable : le blocage est à plus de 60 jours, pas à J+30. À J+30 on alerte la direction. La démo avait les deux ; 30 jours bloquerait tout client qui paie avec un mois de …
- FR-115 : Une relance part vraiment : à confirmer par le juriste.
- FR-117 : Probabilité, prévision d'encaissement, provision : les seuils 35 et 40 sont ceux de la démo, deux seuils proches ; à unifier avec le PO.
- FR-119 : Le blocage du crédit bloque la commande : pas de coupure de livraison déjà préparée sans décision du DG.
- FR-121 : Planifier une visite de recouvrement : la Créance est tenue par `paiement` ; amendement du PRD `paiement` à écrire (FR-P13). Alternative écartée : un registre propre à `recouvrement` obligerait `fact…
- FR-121 : Planifier une visite de recouvrement : relances à la date d'échéance, pas à la date d'émission, comme la balance âgée.
- FR-128 : Barème de commission : la commission porte sur l'encaissé, pas sur le facturé ; à confirmer par le PO.
- FR-128 : Barème de commission : les KPI de poste des rôles propres au distributeur (stock, entrepôt, prospection) sont définis dans leurs modules de la partie 2 ; ce module les agrège.
- 6.4 Comptabilité et finance (`finance-transactions`, M22) : le contrat de balance canonique n'a pas de devise ; la devise de l'organisation (XOF) est une convention déclarée par l'Organisation, pas par la balance.
- FR-131 : La balance soumise, et l'export qui vient après : date proposée : mars 2027, à confirmer.
- FR-133 : Déclaration de TVA préparée, télédéclaration « bientôt » : date proposée : à fixer avec le PO ; non demandé pour février.
- FR-135 : Clôture de période : ce n'est pas la clôture légale de l'exercice.
- FR-138 : BFR : le DPO de la démo rapporte le solde total de dette aux achats du mois, sans lien avec les délais réels de paiement ; cette formule est reprise telle quelle tant…
- FR-141 : Run fournisseurs et ordres de paiement : les ristournes fournisseurs, les lignes bancaires et les covenants (statuts et calculs de la démo) sont lus mais non modifiables en première version ; aucun bou…
- FR-143 : ROI et indicateurs de campagne calculés : la référence « habituelle » = moyenne des 3 mois précédents ; à valider avec le PO.
- FR-149 : Relier les commandes aux campagnes : règle d'attribution à valider avec le PO.
- FR-149 : Relier les commandes aux campagnes : le studio réseaux sociaux (calendrier de publications, inbox unique) est le module `studio-social` de la partie 2. Ses publications réelles (Facebook, TikTok, I…
- 6.6 Contrôle de gestion (`controle-gestion`, M25) : le manifeste classe le contrôle de gestion « distributeur ; microfinance à confirmer » ; la colonne IMF est une proposition.
- FR-156 : Périmètre du contrôle de gestion : l'axe « famille » exige que `catalogue` porte la famille de produits (partie 2) ; sans `catalogue`, l'axe est « non installé ».
- FR-164 : Un badge qui compte le travail réel : la démo utilise 150 ; paramétrable
- FR-164 : Un badge qui compte le travail réel : une file d'arbitrage unique pour toutes les règles, au lieu d'une par cockpit ; chaque cockpit en affiche sa part.
- FR-170 : PDF et Envoyer, pour de vrai : récurrence hebdomadaire seulement en première version.
- FR-171 : Exports et courrier de gestion : le code `dashboard` est « déprécié » au catalogue (M28) ; ce module est à réactiver. Les cockpits restent une composition de lectures et ne possèdent pas de don…
- FR-171 : Exports et courrier de gestion : les seuils des 8 chiffres sont des garde-fous paramétrables (valeurs de la démo) ; en absolu, ils ne conviennent qu'à un grand grossiste.

**Partie 4 et annexe A**


---

## Annexe A. Contrat de module (13 lignes par module)

Le contrat `CONTRAT-DE-MODULE-2026-11-09.md` (§6) demande à chaque PRD une section de **treize lignes**, une par clause C1 à C13. Cette annexe la donne pour les seize modules des parties 2 et 3, puis renvoie aux manifestes des huit modules de la partie 4. Règles de lecture :

- **Une ligne vide fait échouer le contrôle de préparation** (`bmad-check-implementation-readiness`). Aucune cellule n'est donc vide : une clause « sans objet » dit pourquoi. **C11 « sans objet »** dit pourquoi le module n'a pas d'IA ; **C12 et C13** ne sont jamais « sans objet » sans raison écrite.
- Les noms de codes, de droits et de topics sont des **propositions** sauf mention contraire ; `[ASSUMPTION : …]` marque ce qui n'a pas de source.
- Conventions communes, vraies pour chaque module sauf mention contraire. **Gate** : refus `<CODE>_NOT_ENTITLED` (code en majuscules, tiret remplacé par `_`), 403 sans donnée, lecture de l'état publié seul (C2, amendements). **Cloisonnement** : `organisationId` sur chaque lecture et écriture (graphie des nouveaux contrats, C5) et, pour les modules à périmètre, la portée lue dans `reseau.portee.changed@1`. **Profil** : `profiles: ["<code>"]` au compose (C10). **Version** : `1.0.0`. **Routes C13** : `GET|POST /api/v1/instance/<code>/{organisationId}/{export|import|effacement|sante}` et `verifications/<code>` (tableau du contrat, amendement du 2026-11-11). **Lecture seule** : `GET`, `HEAD`, `OPTIONS` plus l'export ; toute écriture rend 403 `ABONNEMENT_EXPIRE`. **Essai** : toute sortie réelle est interceptée et comptée, l'écriture réelle rend `ECRITURE_REELLE_DEPUIS_ESSAI`. **Export** : CSV et JSON par organisation, réservé à `instance:donnees:exporter`. **Effacement** : tracé, avec certificat. **Données** : le module écrit seul ses collections ; il lit les autres par leurs faits (C3).
- **Format des droits.** Le contrôle visé est `^[a-z]+:[a-z-]+:[a-z]+$` (module en lettres seules, objet avec tiret admis, action en lettres seules). **Cinq codes de module de cette annexe ont un tiret : `conquete-objectifs`, `studio-social`, `controle-gestion`, `finance-transactions`, `support-client`.** Ils ne passent pas le format de droit actuel d'`auth-service` (`TENANT_PERMISSION_FORMAT`). L'amendement C7 du 2026-11-11 prévoit l'élargissement (`^[a-z-]+:[a-z-]+:[a-z]+$`), dont la story `auth-service` se livre **avant la semaine 5** ; ces cinq modules ne peuvent pas être installés avant elle. D'ici là leurs droits sont écrits dans la forme élargie. Le catalogue des droits est aussi un `enum` fermé de 13 codes (C7) : chaque droit ci-dessous demande une PR `auth-service` à la livraison du module.
- **Dépendances.** `depends` bloque l'installation, `enrichiPar` ne bloque jamais (contrat §3) ; aucun cycle (`MANIFESTE_CYCLE`). Le graphe proposé : `reseau` ← `pdv` ← {`commande`, `facturation`, `conquete-objectifs`, `freelance`, `marketing`, `support-client`} ; `catalogue` ← {`commande`, `facturation`, `freelance`, `approvisionnement`} ; `stock` ← {`approvisionnement`, `entrepot`} ; `commande` ← `entrepot` ; `paiement` ← {`recouvrement`, `finance-transactions`} ; `notification` ← {`recouvrement`, `marketing`}. Aucun module n'en dépend en retour (les retours passent par `enrichiPar`). Les dépendances dures de `commande` (`catalogue`, `pdv`) sont une `[ASSUMPTION]` de ce PRD, sans source.
- **Vérifications** : chacune a une route, un résultat 🟢, 🟠 ou 🔴 et un critère chiffré.

### A.1 Commande (`commande`, M08)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'commande'`, `version: '1.0.0'`. `depends: [{catalogue, "Une ligne de commande vise un article et un prix résolu par la grille."}, {pdv, "Une commande appartient à un point de vente et lit son plafond et ses conditions de règlement."}]` [ASSUMPTION : dépendances dures proposées, sans source]. `enrichiPar: [stock (disponible et réservation), facturation (facture en un clic), paiement (encaissement au comptant), terrain (commande saisie en tournée), entrepot (bon de livraison préparé), recouvrement (crédit bloqué)]`. |
| C2 Socle | Gate `COMMANDE_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée (zone, portefeuille) : un commercial ne lit que ses commandes, un freelance que les siennes (FR-C30), un superviseur sa zone. Service porteur : `commande-service` [À CONFIRMER, M08]. |
| C3 Données possédées | Commandes, lignes, états (brouillon, validée, préparée, livrée, annulée), demandes de remise et leur décision, bons de livraison émis, journal d'états. Lues seulement : articles et prix (`catalogue`), plafond et conditions (`pdv`), disponible (`stock`). |
| C4 Emplacements vides | `stock` absent : disponible et réservation = `{etat: NON_INSTALLE, module: stock}` (la commande se valide sans contrôle de stock et le dit) ; `facturation` absent : « Transformer en facture » = `NON_INSTALLE` ; `recouvrement` absent : crédit bloqué = `NON_INSTALLE` ; `entrepot` absent : statut de préparation = `NON_INSTALLE`. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `commande.commande.validee@1`, `commande.commande.annulee@1`, `commande.commande.changed@1`, `commande.remise.decidee@1`, `commande.bon-livraison.emis@1`. Consomme `catalogue.grille.publiee@1`, `catalogue.article.changed@1`, `pdv.plafond.changed@1`, `pdv.point-de-vente.changed@1`, `stock.disponible.changed@1`, `entrepot.expedition.livree@1`, `etat-publie.changed.reel@1` et `.essai@1`. |
| C6 Paramètres | Blocage dur ou avertissement au dépassement du plafond ; seuil de remise exigeant une validation (12 % dans la démo, `combo-stock-workflow.ts:7`) ; états configurables du cycle ; remise maximale ; référentiel de motifs d'annulation. Données, jamais code. |
| C7 Droits | `commande:commande:saisir`, `commande:commande:valider`, `commande:commande:annuler`, `commande:portefeuille:consulter`, `commande:reseau:consulter`, `commande:remise:valider`, `commande:bon-livraison:emettre`. Format conforme. |
| C8 Module d'écran | `src/modules/commande/` : `/commandes` (trois vues pilotage, terrain, freelance), `/disponibilite` (trois états du commercial), tiroir panier. Entrées : « Commandes » (`commande:portefeuille:consulter` ou `commande:reseau:consulter`), « Disponibilité » (`commande:portefeuille:consulter`). Boutons non branchés de la démo : « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien ; commandes et bons de livraison restent stockés et masqués ; test aller-retour. Avertissement : « Les commandes ne seront plus saisissables ; les factures déjà émises restent. » |
| C10 Démarrer seul | `profiles: ["commande"]` ; socle + `catalogue` + `pdv` + `reseau` (dépendances dures installées par le moteur). |
| C11 IA | `ia: { modeles: ['recommandation-panier', 'detection-erreur-commande'], finalites: ['suggestion-de-panier', 'controle-de-saisie'] }` [ASSUMPTION : offre « recommandation de panier, détection d'erreurs » ; la démo est déterministe ; moteur à trancher]. Journal local des prédictions et corrections ; prédiction affichée avec modèle, version, date. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteurs : `blocage-dur-plafond`, `controle-stock-obligatoire` (comportement seulement, jamais la forme des données). Un état de commande ajouté est lu comme inconnu par la version précédente. |
| C13 Installable sous contrôle | Prérequis : `catalogue` et `pdv` en service. Vérifications : `grille-resolue` (🟢 si 100 % des articles du jeu de contrôle résolvent un prix ; 🔴 si un seul n'en a pas) ; `plafond-lu` (🟢 si le plafond de 3 points de vente d'essai est projeté). Lecture seule : `GET /api/v1/commandes`, `/commandes/{id}`, export. Export, import, effacement par organisation ; `objetsDeReprise: []` [le brain dump ne reprend pas les commandes en cours ; historique : OQ-4-5] ; `domainesEchange: []` en février (commandes terrain = Prospera, propriétaire par défaut, FR-14). |

### A.2 Facturation, proforma et e-facture (`facturation`, M09)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'facturation'`, `1.0.0`. `depends: [{catalogue, "Une ligne de facture porte un article, une taxe et un prix résolu."}, {pdv, "Une facture est émise à un point de vente et lit ses conditions de règlement et son plafond."}]` [ASSUMPTION]. `enrichiPar: [commande (facture en un clic), paiement (encaissement et lien), stock (sortie facturée), recouvrement, notification (envoi PDF), connecteurs (export vers Sage, plus tard)]`. Service porteur : `paiement-service` + `facturation` [À CONFIRMER, M09 : partiel, STORY-647/649]. |
| C2 Socle | Gate `FACTURATION_NOT_ENTITLED`. `organisationId` + portée. Un freelance ne lit que ses factures (double flux société/freelance). |
| C3 Données possédées | Factures, lignes, avoirs, proformas et leur probabilité d'acceptation, **compteur de numérotation par série**, créances ouvertes (reste dû par facture), journal d'émission, statut e-facture (hors février). |
| C4 Emplacements vides | `commande` absent : « Facture depuis commande » = `NON_INSTALLE`, la facture se saisit directement ; `paiement` absent : encaissement et lien = `NON_INSTALLE`, le solde reste inchangé ; `stock` absent : marge = `NON_INSTALLE` (le coût de revient vient du stock) ; `notification` absent : « Envoyer par e-mail » = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `facturation.facture.emise@1`, `facturation.facture.changed@1`, `facturation.avoir.emis@1`, `facturation.creance.changed@1` (reste dû, ancienneté), `facturation.proforma.changed@1`. Consomme `commande.commande.validee@1`, `paiement.encaissement.valide`, `paiement.encaissement.annule`, `paiement.creance.soldee`, `catalogue.grille.publiee@1`, `pdv.plafond.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Taux de TVA (18 % au Togo, référentiel fiscal), mentions légales, format du numéro (préfixe, année, largeur), séries (facture, avoir, proforma), durée de validité de la proforma, référentiel de conditions de règlement (lu de `pdv`). |
| C7 Droits | `facturation:facture:emettre`, `facturation:facture:consulter`, `facturation:avoir:emettre`, `facturation:proforma:gerer`, `facturation:balance:consulter`, `facturation:numerotation:administrer` (initialisation par la reprise, droit restreint). Format conforme. |
| C8 Module d'écran | `/facturation` (onglets Factures et créances, Proformas, E-facturation et avoirs). Entrées : « Factures » (`facturation:facture:consulter`), « Proformas » (`facturation:proforma:gerer`), « Balance clients » (`facturation:balance:consulter`). « Imprimer / PDF » et « Envoyer au client » sont exigés en février ; « Corriger et retransmettre » (e-facture OTR) : « bientôt » (la facture normalisée OTR n'est pas exigée en février). |
| C9 Installer/désinstaller | Rien n'est supprimé ; le **compteur de numérotation est conservé** : réinstaller reprend au numéro suivant, sans trou ni doublon. Avertissement : « Plus aucune facture ne pourra être émise ; la suite de numéros est conservée. » |
| C10 Démarrer seul | `profiles: ["facturation"]` ; socle + `catalogue` + `pdv` + `reseau`. |
| C11 IA | `ia: { modeles: ['score-acceptation-proforma', 'scoring-credit-client', 'prevision-encaissement'], finalites: ['aide-a-la-decision-credit', 'priorisation-des-creances'] }` [ASSUMPTION : offre « scoring crédit, score d'acceptation, prévision 7/30 jours »]. Le scoring de crédit est une aide : il n'accorde ni ne refuse seul (garde-fou « plafond de crédit non négociable »). |
| C12 Migrations | `retourArriere: 'SANS_PERTE'` (règle d'or : le compteur de numérotation ne change jamais de forme dans la fenêtre de 7 jours). Interrupteurs : `e-facture-otr` (certification, hors février), `avoir-automatique-sur-annulation`. |
| C13 Installable sous contrôle | Prérequis : `catalogue`, `pdv` ; référentiel fiscal du Togo publié. Vérifications : `numerotation-continue` (🟢 si la suite de la série n'a ni trou ni doublon sur les 100 derniers numéros ; 🔴 sinon) ; `balance-equilibree` (🟢 si la somme des reste-dû égale la somme des factures moins la somme des encaissements imputés, écart 0 FCFA). Lecture seule : consultation, PDF, export. **`objetsDeReprise: ['facturation.facture-ouverte@1', 'facturation.suite-numerotation@1']`** [ASSUMPTION : proposés, voir FR-216 et FR-217] avec valeurs de contrôle « reste dû » (montant) et « dernier numéro » (donnée). **`domainesEchange`** [ASSUMPTION, rien en février] : `facturation.factures` (`MOUVEMENT`, `argent: true`, `controle: true`, publie `facturation.facture.emise@1`) et `facturation.creances` (`OBJET_DATE`, propriétaire Odoo si le client le garde, FR-14 de Connecteurs) ; un seul point d'écriture par domaine, avec identifiant stable et `rang`. |

### A.3 Approvisionnement et fournisseurs (`approvisionnement`, M10)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'approvisionnement'`, `1.0.0`. `depends: [{stock, "Le réapprovisionnement part du disponible, du seuil et de la couverture."}, {catalogue, "Une commande fournisseur vise des articles et des conditionnements."}]` [ASSUMPTION]. `enrichiPar: [paiement (ordres de paiement fournisseurs), finance-transactions (plancher de trésorerie), notification (alerte DAF), entrepot (réception), connecteurs (fournisseurs, Odoo)]`. |
| C2 Socle | Gate `APPROVISIONNEMENT_NOT_ENTITLED`. `organisationId` ; périmètre par entrepôt pour le responsable stock. |
| C3 Données possédées | Fournisseurs (registre, note explicable, délais, franco, plafonds), commandes fournisseurs (cycle SUGGEREE → RECUE), règles de réapprovisionnement, journal des suggestions et décisions. |
| C4 Emplacements vides | `finance-transactions` absent : plancher de trésorerie = `NON_INSTALLE` (l'achat n'est pas bloqué mais l'écran le dit, garde-fou non vérifié) ; `paiement` absent : « Payer » = `NON_INSTALLE` ; `entrepot` absent : réception saisie directement dans `stock`. |
| C5 Contrats nommés | Publie `approvisionnement.commande-fournisseur.changed@1`, `approvisionnement.fournisseur.changed@1`, `approvisionnement.reception.enregistree@1`, `approvisionnement.escalade.demandee@1`. Consomme `stock.alerte.changed@1`, `stock.disponible.changed@1`, `catalogue.article.changed@1`, `finance-transactions.tresorerie.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Règles de réappro (seuil, couverture cible), plancher de trésorerie avant tout envoi automatique, barème de note de fournisseur, regroupement franco/volume. Données, jamais code. |
| C7 Droits | `approvisionnement:fournisseur:gerer`, `approvisionnement:commande-fournisseur:valider`, `approvisionnement:commande-fournisseur:suggerer`, `approvisionnement:reception:enregistrer`, `approvisionnement:regle:definir`. Format conforme. |
| C8 Module d'écran | `/approvisionnement` (Réappro IA, Commandes fournisseurs, Fournisseurs, Règles). Entrées visibles avec `approvisionnement:fournisseur:gerer` ou `…:commande-fournisseur:valider`. « Basculer sur le fournisseur alternatif » : « bientôt ». |
| C9 Installer/désinstaller | Rien supprimé ; commandes fournisseurs en cours conservées ; avertissement : « Les suggestions de réapprovisionnement cessent ; les commandes ouvertes ne sont plus suivies. » |
| C10 Démarrer seul | `profiles: ["approvisionnement"]` ; socle + `catalogue` + `stock`. |
| C11 IA | `ia: { modeles: ['prevision-demande', 'scoring-fournisseur-explicable'], finalites: ['reapprovisionnement-propose', 'choix-fournisseur-justifie'] }` [ASSUMPTION]. Le garde-fou de trésorerie est une règle, non un modèle ; il n'est jamais contourné par la prédiction. |
| C12 | `SANS_PERTE`. Interrupteurs : `envoi-automatique-commande-fournisseur` (éteint par défaut), `escalade-daf`. |
| C13 | Prérequis : `stock` en service. Vérifications : `articles-lies` (🟢 si 100 % des articles suggérés existent au catalogue) ; `regle-valide` (🟢 si chaque règle a un seuil ≥ 0). Lecture seule : registre, commandes, export. **`objetsDeReprise: ['approvisionnement.fournisseur@1']`** [ASSUMPTION : la spine de la Reprise désigne `approvisionnement` « à créer » ; module non codé, « non installé » possible en février]. `domainesEchange` [ASSUMPTION, rien en février] : `approvisionnement.fournisseurs` (propriétaire Odoo si le client le garde, FR-14). |

### A.4 Opérations entrepôt (`entrepot`, M11)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'entrepot'`, `1.0.0`. `depends: [{stock, "Toute opération d'entrepôt écrit des mouvements de stock."}, {commande, "On prépare et expédie des commandes validées."}]` [ASSUMPTION ; M11 « peut s'adosser à stock-service » : à confirmer]. `enrichiPar: [reseau (zone desservie), terrain (remise d'espèces à l'expédition), facturation (bon de livraison facturé), approvisionnement (réception fournisseur), marketing (liquidation)]`. |
| C2 Socle | Gate `ENTREPOT_NOT_ENTITLED`. `organisationId` et périmètre **par entrepôt** : le gestionnaire d'entrepôt ne voit que son site (`user.entrepot` dans la démo). |
| C3 Données possédées | Préparations, vagues de picking, expéditions, chargements de camion, réceptions et litiges, contrôles au quai, plannings d'inventaire tournant, affectation des préparateurs. Les quantités sont écrites chez `stock` par mouvements, jamais ici. |
| C4 Emplacements vides | `commande` absent n'est pas possible (dépendance dure) ; `terrain` absent : encaissement à l'expédition = `NON_INSTALLE` ; `approvisionnement` absent : réception sans commande fournisseur liée ; `reseau` absent : zone de desserte = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `entrepot.preparation.terminee@1`, `entrepot.expedition.livree@1`, `entrepot.reception.enregistree@1`, `entrepot.litige.ouvert@1`, `entrepot.inventaire.compte@1`. Consomme `commande.commande.validee@1`, `stock.disponible.changed@1`, `stock.point-de-stock.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Poids, volume et palettes par camion ; coupure camion (heure limite) ; taille de vague ; seuil d'écart de réception ; fréquence d'inventaire tournant par classe ABC. |
| C7 Droits | `entrepot:preparation:realiser`, `entrepot:expedition:gerer`, `entrepot:chargement:gerer`, `entrepot:reception:controler`, `entrepot:inventaire:planifier`, `entrepot:liquidation:decider`. Format conforme. |
| C8 Module d'écran | `/entrepot` (« Mon entrepôt » pour le gestionnaire, vue réseau pour le responsable). Entrées : Préparation, Expéditions, Réceptions, Inventaire (droits ci-dessus). « Valider » un inventaire produit un ajustement via `stock` (FR-199). |
| C9 | Rien supprimé ; expéditions en cours conservées. Avertissement : « Les préparations en cours ne seront plus suivies. » |
| C10 | `profiles: ["entrepot"]` ; socle + `catalogue` + `stock` + `commande` + `pdv` + `reseau`. |
| C11 | Sans objet : picking, vagues et plan d'expédition sont des règles déterministes paramétrées (C6), sans modèle appris ; l'« ordre de picking » de l'offre est un tri par règle. Si un modèle est introduit, la clause s'applique et `ia` est déclaré. |
| C12 | `SANS_PERTE`. Interrupteurs : `coupure-camion-stricte`, `controle-quai-obligatoire`. |
| C13 | Prérequis : `stock`, `commande`. Vérifications : `entrepots-lies` (🟢 si chaque entrepôt de `reseau` a un point de stock). Lecture seule : consultation des expéditions, export. `objetsDeReprise: []` (aucun objet repris : le stock d'ouverture est dans `stock`). `domainesEchange: []` (opérations internes). |

### A.5 Conquête, territoires, objectifs et quotas (`conquete-objectifs`, M13)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'conquete-objectifs'` (**code à tiret : voir le point d'attention du préambule**), `1.0.0`. `depends: [{reseau, "Zones, zones blanches et portée viennent du réseau."}, {pdv, "Prospects, ouvertures et passation concernent des points de vente."}]`. `enrichiPar: [commande (premières commandes, atterrissage), facturation (chiffre d'affaires réalisé), terrain (visites), equipe (commerciaux)]`. |
| C2 Socle | Gate `CONQUETE_OBJECTIFS_NOT_ENTITLED`. `organisationId` et portée de zone : un chargé de prospection ne voit que son territoire. |
| C3 Données possédées | Carnet de prospects, recensements de zone, suivi des ouvertures (actif à M+1, M+3), passations au secteur, objectifs et quotas par zone, mix produit et marge cibles, arbitrages. |
| C4 Emplacements vides | `commande`/`facturation` absents : atterrissage et première commande = `NON_INSTALLE` (jamais 0 % ni 100 %) ; `terrain` absent : visites du prospect = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `conquete-objectifs.prospect.changed@1`, `conquete-objectifs.passation.effectuee@1`, `conquete-objectifs.objectif.changed@1`. Consomme `reseau.noeud.created@1`, `reseau.portee.changed@1`, `pdv.point-de-vente.changed@1`, `commande.commande.validee@1`, `facturation.facture.emise@1`. |
| C6 | Garde-fou de première commande (montant maximal, crédit refusé à un nouveau client) ; barème de survie M+1/M+3 ; règle de répartition des quotas. Données. |
| C7 | `conquete-objectifs:prospect:gerer`, `conquete-objectifs:zone-blanche:recenser`, `conquete-objectifs:passation:declarer`, `conquete-objectifs:objectif:definir`, `conquete-objectifs:objectif:consulter` (écrits dans la forme élargie, en attente de l'amendement de format). |
| C8 | `/prospection`, `/objectifs`. Entrées : « Prospection » (`…:prospect:gerer`), « Objectifs » (`…:objectif:consulter`). « Transférer » (passation) est exigé en février ; le recensement de zone sur carte (Google Maps) l'est aussi. |
| C9 | Rien supprimé ; prospects et objectifs conservés. Avertissement : « Les objectifs et prospects ne seront plus accessibles ; leurs données sont conservées. » |
| C10 | `profiles: ["conquete-objectifs"]` ; socle + `reseau` + `pdv`. |
| C11 | `ia: { modeles: ['scoring-prospects', 'allocation-quotas'], finalites: ['priorisation-prospects', 'suggestion-allocation'] }` [ASSUMPTION : offre « scoring prospects, suggestions d'allocation »]. |
| C12 | `SANS_PERTE`. Interrupteur : `passation-automatique`. |
| C13 | Prérequis : `reseau`, `pdv`. Vérification : `zones-chargees` (🟢 si ≥ 1 zone lue). Lecture seule : consultation, export. `objetsDeReprise: []` (prospects non repris en février [ASSUMPTION]). `domainesEchange: []`. |

### A.6 Studio réseaux sociaux (`studio-social`, M24)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'studio-social'` (**code à tiret**), `1.0.0`. `depends: []`. `enrichiPar: [marketing (campagnes), stock (produits à écouler), commande (ventes), notification (réponses WhatsApp)]`. Service à créer [À CONFIRMER, M24]. |
| C2 Socle | Gate `STUDIO_SOCIAL_NOT_ENTITLED`. `organisationId` ; périmètre par compte social connecté. |
| C3 Données possédées | Calendrier éditorial, publications (brouillon, validée, programmée, publiée), comptes connectés (jetons chiffrés), boîte de réception, réponses automatiques, mesure de ROI incrémental. |
| C4 Emplacements vides | `stock` absent : « suggestions depuis le stock » = `NON_INSTALLE` ; `marketing` absent : rattachement à une campagne = `NON_INSTALLE` ; `commande` absent : ROI incrémental = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `studio-social.publication.changed@1`, `studio-social.message.recu@1`. Consomme `stock.alerte.changed@1`, `marketing.campagne.changed@1`, `etat-publie.changed.*@1`. |
| C6 | Réseaux activés (Facebook, Instagram, TikTok, WhatsApp), fenêtres de publication, charte éditoriale, règle de validation avant publication. Données. |
| C7 | `studio-social:publication:programmer`, `studio-social:publication:valider`, `studio-social:compte:connecter`, `studio-social:message:repondre` (forme élargie, en attente du format). |
| C8 | `/marketing/social`. Entrées : « Calendrier » (`…:publication:programmer`), « Boîte de réception » (`…:message:repondre`). « Valider et programmer » et « Envoyer » : « bientôt » tant que l'OAuth Meta n'est pas raccordé. |
| C9 | Rien supprimé ; les jetons des comptes sont révoqués à la désinstallation et à la réinstallation il faut reconnecter ; avertissement le dit. |
| C10 | `profiles: ["studio-social"]` ; socle seul. |
| C11 | `ia: { modeles: ['accroches-posts', 'classification-messages'], finalites: ['redaction-assistee', 'tri-de-la-boite'] }` [ASSUMPTION]. Toute accroche générée porte sa provenance et reste validée par un humain avant publication. |
| C12 | `SANS_PERTE`. Interrupteur : `reponse-automatique`. |
| C13 | Prérequis : application Meta approuvée, jetons valides [À CONFIRMER]. Vérification : `compte-joignable` (🟢 si l'appel de test au réseau répond en moins de 5 s). Interception en essai : aucune publication réelle ; lecture seule : calendrier, export. `objetsDeReprise: []`, `domainesEchange: []`. Hors périmètre de février [ASSUMPTION]. |

### A.7 Réseau freelance (`freelance`, M42)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'freelance'`, `1.0.0`. **Add-on, non un module** [À CONFIRMER, M42 : manifeste ou option de pack]. `depends: [{catalogue, "Le freelance achète au tarif société et fixe ses prix de revente (FR-C28)."}, {pdv, "Le portefeuille du freelance est un ensemble de points de vente."}]` [ASSUMPTION]. `enrichiPar: [commande, facturation (double flux), terrain, equipe (classement séparé)]`. |
| C2 Socle | Gate `FREELANCE_NOT_ENTITLED`. Cloisonnement le plus strict du produit : par `organisationId` **et par freelance** ; deux freelances ne se voient pas (FR-C30) ; la société ne voit pas les prix de revente (FR-C29). |
| C3 Données possédées | Statut de l'indépendant (activation, départ), créances séparées, classement séparé, commissions [ASSUMPTION]. **Les prix de revente appartiennent à `catalogue`, jamais ici.** |
| C4 Emplacements vides | `commande`/`facturation` absents : créances et marge du freelance = `NON_INSTALLE` ; `equipe` absent : classement = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `freelance.freelance.active@1`, `freelance.freelance.parti@1` (doublon à éviter avec `pdv.commercial.parti@1` : celui-ci est la source). Consomme `reseau.commercial.changed@1`, `pdv.commercial.parti@1`, `catalogue.profil.changed@1`. |
| C6 | Barème d'abonnement par freelance actif (add-on), règles d'activation, plafond d'encours du freelance. Données. |
| C7 | `freelance:portefeuille:consulter` (le sien), `freelance:creance:consulter` (les siennes), `freelance:classement:consulter`, `freelance:freelance:activer`. Aucun droit ne donne la lecture des prix de revente à la société. |
| C8 | Cockpit du freelance (`DashboardFreelance`), « Mon portefeuille », « Mes prix » (écran servi par `catalogue`). La marge n'est visible que du freelance (FR-195). |
| C9 | Rien supprimé ; au départ d'un freelance, la révélation des prix suit le seul processus de `pdv` (`pdv.commercial.parti@1`). Avertissement : « Désinstaller l'add-on ne révèle aucun prix à la société. » |
| C10 | `profiles: ["freelance"]` ; socle + `catalogue` + `pdv` + `reseau`. |
| C11 | Sans objet au premier jour : « recommandation de prix client » et « marge optimale » (offre) supposeraient d'apprendre sur des prix que la société n'a pas le droit de voir (FR-C29). Aucune finalité d'apprentissage ne lit un prix de freelance ; tout modèle futur exige une décision du PO et un consentement du freelance. |
| C12 | `SANS_PERTE`. Interrupteur : `activation-par-freelance` (facturation de l'add-on). |
| C13 | Prérequis : `catalogue`, `pdv`. Vérification : `etancheite-prix` (🟢 si un compte « société » du jeu de contrôle reçoit 0 champ de prix de revente sur 20 requêtes d'API ; 🔴 sinon). Export par organisation : **l'export de la société exclut les prix de revente** (FR-C29) ; l'export du freelance lui est propre. `objetsDeReprise: []`, `domainesEchange: []` (jamais d'échange : les prix de revente ne sortent pas). |

### A.8 Commercial terrain et application mobile (`terrain`, M12)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'terrain'`, `1.0.0`. `depends: [{reseau, "Les tournées, la carte d'équipe et la couverture se rattachent aux zones."}]`. `enrichiPar: [pdv (clients visités), commande, catalogue, stock (relevé du commercial, FR-S56), paiement (encaissement terrain), recouvrement (tournée de recouvrement), facturation, notification]`. **Un seul service pour deux verticales** (distributeur et microfinance : agents terrain, collecte) : le vocabulaire (« visite », « client » ou « membre », « tournée ») est une **donnée** (C6), pas deux modules. Application mobile `prospera-terrain`. |
| C2 | Gate `TERRAIN_NOT_ENTITLED`. `organisationId` et portée ; le commercial ne voit que sa tournée ; le superviseur son équipe. |
| C3 | Tournées (PJP), missions, visites et leur clôture (résultat, commentaire, photos géolocalisées), positions GPS d'équipe, remises d'espèces et écarts de caisse, agenda. |
| C4 | `pdv` absent : la visite vise un lieu libre, « point de vente » = `NON_INSTALLE` ; `commande` absent : « Prendre une commande » = `NON_INSTALLE` ; `stock` absent : relevé de stock = `NON_INSTALLE` ; `paiement` absent : encaissement = `NON_INSTALLE`. Test par dépendance. |
| C5 | Publie `terrain.visite.cloturee@1`, `terrain.remise.declaree@1`, `terrain.position.changed@1`, `terrain.releve-stock.saisi@1`. Consomme `reseau.noeud.created@1`, `reseau.portee.changed@1`, `pdv.point-de-vente.changed@1`, `commande.commande.validee@1`, `paiement.encaissement.valide`. |
| C6 | Vocabulaire par verticale (libellés en donnée), durée d'une visite, rayon de géofencing, barème de caisse (seuil d'écart), fenêtre d'optimisation de tournée. |
| C7 | `terrain:visite:realiser`, `terrain:tournee:planifier`, `terrain:equipe:consulter`, `terrain:mission:affecter`, `terrain:remise:declarer`, `terrain:remise:valider`. Format conforme. |
| C8 | `/commercial` (carte GPS d'équipe, coaching), `/tournees` (PJP, strike rate, caisse), `/mon-activite` (« Ma journée », clôture de visite). Fond de carte Google Maps commun (FR-192). Menus : « Ma journée » (`terrain:visite:realiser`), « Tournées » (`terrain:tournee:planifier`), « Équipe » (`terrain:equipe:consulter`). « Y aller » et « Clôturer » doivent aboutir en février ; l'application mobile hors ligne : « bientôt ». |
| C9 | Rien supprimé ; visites et positions conservées. Avertissement : « Les tournées et la clôture de visite cesseront ; l'application mobile ne se synchronisera plus. » |
| C10 | `profiles: ["terrain"]` ; socle + `reseau`. |
| C11 | `ia: { modeles: ['optimisation-tournees', 'recommandation-panier', 'validation-geofencing'], finalites: ['planification-de-tournee', 'aide-a-la-commande', 'controle-de-presence'] }` [ASSUMPTION : offre « optimisation de tournées, voice-to-CRM, géofencing » ; voice-to-CRM hors périmètre]. Données de position : niveau de consentement 0 par défaut. |
| C12 | `SANS_PERTE`. La **synchronisation de l'appareil** doit lire deux versions : l'appareil tolère un champ inconnu. Interrupteurs : `mode-hors-ligne`, `optimisation-automatique`. |
| C13 | Prérequis : `reseau` ; Google Maps pour la carte. Vérifications : `zones-lues` (🟢 si ≥ 1 zone) ; `fond-de-carte` (🟢 si la clé Google Maps répond). Lecture seule : consultation des visites, export. Essai : aucune position réelle collectée. `objetsDeReprise: []`, `domainesEchange: []` (visites et commandes terrain = Prospera, FR-14). |

### A.9 Relances et recouvrement (`recouvrement`, M19)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'recouvrement'`, `1.0.0`. **Deux verticales** (distributeur : factures impayées ; microfinance : impayés de crédit, PAR), même service, **vocabulaire en donnée**. `depends: [{paiement, "Les créances, promesses et liens de paiement sont portés par paiement."}, {notification, "Les relances multicanal partent par notification."}]` [ASSUMPTION : chaque vertical lit sa source par `enrichiPar`]. `enrichiPar: [facturation (factures impayées), credit (impayés IMF) [ASSUMPTION], pdv (blocage du crédit), terrain (tournée de recouvrement), comptabilité]`. |
| C2 | Gate `RECOUVREMENT_NOT_ENTITLED`. `organisationId` et portée : le recouvrement ne voit que ses dossiers (`/relances` « Mes dossiers »), le commercial « Mes relances ». |
| C3 | Dossiers de relance, séquence d'escalade, promesses de paiement, décision de blocage ou déblocage du crédit avec trace de surcharge, balance âgée projetée, journal d'actions. |
| C4 | `facturation` absent : dossiers sans source en distributeur = `NON_INSTALLE` ; `pdv` absent : blocage du crédit = décision publiée sans effet, l'écran le dit ; `terrain` absent : « visite de recouvrement » = `NON_INSTALLE` ; `credit` absent : source IMF = `NON_INSTALLE`. |
| C5 | Publie `recouvrement.dossier.changed@1`, `recouvrement.credit.bloque@1`, `recouvrement.credit.debloque@1`, `recouvrement.promesse.changed@1`. Consomme `facturation.creance.changed@1`, `paiement.creance.soldee`, `paiement.promesse.constatee`, `notification.reponse.recue`, `pdv.plafond.changed@1`. |
| C6 | Séquence d'escalade (WhatsApp → SMS → visite → DG) en données ; `SEUIL_EXCLUSION_JOURS` ; durée des paliers ; modèles de message ; vocabulaire par verticale. |
| C7 | `recouvrement:dossier:traiter`, `recouvrement:relance:envoyer`, `recouvrement:promesse:enregistrer`, `recouvrement:credit:bloquer`, `recouvrement:credit:debloquer`, `recouvrement:regle:definir`, `recouvrement:balance:consulter`. Format conforme. |
| C8 | `/relances`, balance âgée, blocage de crédit avec trace. Menus : « Mes dossiers » (`recouvrement:dossier:traiter`), « Balance âgée » (`recouvrement:balance:consulter`). « Relancer » et « Bloquer le crédit » doivent aboutir en février. |
| C9 | Rien supprimé ; promesses et dossiers conservés ; les crédits suspendus restent suspendus chez `pdv`. Avertissement : « Les crédits déjà bloqués le restent jusqu'à déblocage manuel dans les points de vente. » |
| C10 | `profiles: ["recouvrement"]` ; socle + `paiement` + `notification`. |
| C11 | `ia: { modeles: ['priorisation-par-probabilite', 'choix-du-canal'], finalites: ['priorisation-des-dossiers', 'choix-du-canal-de-relance'] }` [ASSUMPTION]. Le blocage du crédit n'est jamais décidé par le modèle seul. |
| C12 | `SANS_PERTE`. Interrupteurs : `blocage-automatique-au-seuil`, `relance-automatique`. |
| C13 | Prérequis : `paiement`, `notification` en service. Vérifications : `source-creances` (🟢 si au moins une source de créances est installée) ; `canal-utilisable` (hérité de `notification`). Essai : aucune relance réelle partie. `objetsDeReprise: []` (les promesses ne sont pas reprises [ASSUMPTION]). `domainesEchange: []` (promesses et relances = Prospera). |

### A.10 Équipes et performance (`equipe`, M21)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'equipe'`, `1.0.0`. Deux verticales (distributeur, microfinance). `depends: [{reseau, "Les équipes et leurs commerciaux viennent du réseau."}]`. `enrichiPar: [pdv, commande, terrain, conquete-objectifs, freelance, facturation]`. Code déjà au catalogue, déprécié, à réactiver. |
| C2 | Gate `EQUIPE_NOT_ENTITLED`. `organisationId` et portée de zone : le responsable des ventes lit sa région, le superviseur son équipe. |
| C3 | Indicateurs individuels calculés, classements, plans de coaching, matrice des postes, benchmarks, typologie salarié/freelance (copie de `reseau.commercial`). |
| C4 | Chaque indicateur dont la source est absente = `NON_INSTALLE` ; `freelance` absent : classement freelance = `NON_INSTALLE`. |
| C5 | Publie `equipe.coaching.changed@1`. Consomme `reseau.commercial.changed@1`, `commande.commande.validee@1`, `facturation.facture.emise@1`, `terrain.visite.cloturee@1`, `conquete-objectifs.objectif.changed@1`. |
| C6 | Définition des KPI, barèmes de classement, matrice des postes. Données. |
| C7 | `equipe:indicateur:consulter`, `equipe:classement:consulter`, `equipe:coaching:gerer`. La validation des demandes de remise appartient à `commande` (`commande:remise:valider`) ; l'écran « Validations » l'appelle. |
| C8 | `/equipe` (`EquipeView`, `MatricePostesPanel`). Menus : « Équipe » (`equipe:indicateur:consulter`). Le superviseur et le responsable ne voient plus la « Vue DG » (FR-186). |
| C9 | Rien supprimé ; coachings conservés. Avertissement : « Les classements ne seront plus calculés. » |
| C10 | `profiles: ["equipe"]` ; socle + `reseau`. |
| C11 | `ia: { modeles: ['ecart-de-performance', 'coaching-cible'], finalites: ['coaching-individuel', 'benchmark-bonnes-pratiques'] }` [ASSUMPTION]. « Recommandation de prix client (freelance) » exclue (FR-C29). |
| C12 | `SANS_PERTE`. Interrupteur : `classement-public-equipe`. |
| C13 | Prérequis : `reseau`. Vérification : `commerciaux-lus` (🟢 si ≥ 1 commercial). Lecture seule : consultation, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.11 Comptabilité et finance, transactions (`finance-transactions`, M22)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'finance-transactions'` (**code à tiret**), `1.0.0`. Trois verticales (distributeur, microfinance, assurance). `depends: [{paiement, "Rapprochement et ordres de paiement reposent sur les encaissements et les ordres de paiement."}]`. `enrichiPar: [facturation (lettrage 411), approvisionnement (factures d'achat, run fournisseurs), balance (écritures, atelier de balance), connecteurs (export comptable plus tard)]`. Service à créer [À CONFIRMER, M22]. **Le produit ne passe pas d'écritures de grand livre à ce jour** (note M22) : le périmètre est le rapprochement, la trésorerie et le run de paiement. |
| C2 | Gate `FINANCE_TRANSACTIONS_NOT_ENTITLED`. `organisationId` ; droits financiers par rôle (DAF, comptable). |
| C3 | Rapprochements facture ↔ paiement, suspens, remises d'espèces rapprochées, prévision de trésorerie à 7 jours, BFR, run de paiement (état, jamais l'ordre : il appartient à `paiement`). |
| C4 | `facturation` absent : lettrage = `NON_INSTALLE` ; `approvisionnement` absent : run fournisseurs = `NON_INSTALLE` ; `balance` absent : écritures = `NON_INSTALLE`. |
| C5 | Publie `finance-transactions.tresorerie.changed@1`, `finance-transactions.rapprochement.effectue@1`. Consomme `paiement.encaissement.valide`, `paiement.encaissement.ecart.constate`, `facturation.creance.changed@1`, `approvisionnement.commande-fournisseur.changed@1`. |
| C6 | Plancher de trésorerie, horizon de prévision, règles de lettrage automatique (montant et référence), tolérance d'arrondi. |
| C7 | `finance-transactions:rapprochement:effectuer`, `finance-transactions:tresorerie:consulter`, `finance-transactions:run:consulter`, `finance-transactions:suspens:traiter`. Préparer et valider un ordre exigent en plus `paiement:*` (deux droits, deux personnes, FR-P66). |
| C8 | `/comptabilite`, `/pilotage-financier` (DAF). Menus : « Rapprochement » (`…:rapprochement:effectuer`), « Trésorerie » (`…:tresorerie:consulter`), « Run fournisseurs » (`…:run:consulter`). « Payer », « Accorder », « Refuser » et « Télédéclarer sur le portail OTR » : « bientôt » en février sauf le run (FR-209). |
| C9 | Rien supprimé ; rapprochements conservés. Avertissement : « Les rapprochements cessent ; les paiements restent chez le module paiement. » |
| C10 | `profiles: ["finance-transactions"]` ; socle + `paiement`. |
| C11 | `ia: { modeles: ['reconciliation-auto', 'detection-anomalies', 'prevision-tresorerie'], finalites: ['lettrage-assiste', 'alerte-anomalie', 'prevision-de-cash'] }` [ASSUMPTION]. Un rapprochement proposé est toujours confirmé par un humain en v1. |
| C12 | `SANS_PERTE`. Interrupteurs : `lettrage-automatique`, `alerte-doublon`. |
| C13 | Prérequis : `paiement`. Vérification : `suspens-bornes` (🟢 si le montant en suspens ≤ seuil de l'organisation). Lecture seule : consultation, export. `objetsDeReprise: []`. `domainesEchange: []` en février [ASSUMPTION]. |

### A.12 Marketing et campagnes (`marketing`, M23)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'marketing'`, `1.0.0`. Deux verticales. `depends: [{pdv, "L'audience est une liste de points de vente (FR-V29)."}, {notification, "Un envoi de campagne part par notification."}]`. `enrichiPar: [stock (combos d'écoulement), recouvrement (exclusion des clients en défaut, FR-211), facturation (créance la plus ancienne), catalogue (promotions), studio-social]`. |
| C2 | Gate `MARKETING_NOT_ENTITLED`. `organisationId` et portée de zone ; le responsable marketing voit « Mon audience ». |
| C3 | Campagnes, segments (copie des critères, jamais des personnes), combos stock → promotions, validations DG, résultats et ROI, scoring de leads. |
| C4 | `recouvrement`/`facturation` absents : exclusion des clients en défaut = « non évaluée » (**jamais** « aucun client exclu »), confirmation explicite avant envoi ; `stock` absent : combos = `NON_INSTALLE`. |
| C5 | Publie `marketing.campagne.changed@1`, `marketing.combo.valide@1`. Consomme `pdv.point-de-vente.changed@1`, `stock.alerte.changed@1`, `recouvrement.credit.bloque@1`, `facturation.creance.changed@1`, `notification.envoi.delivre`, `notification.reponse.recue`. |
| C6 | `SEUIL_EXCLUSION_JOURS` (lu), plafond de messages par destinataire (porté par `notification`, FR-212), seuil de remise exigeant une validation DG, canaux d'une campagne. |
| C7 | `marketing:campagne:gerer`, `marketing:campagne:valider`, `marketing:combo:proposer`, `marketing:combo:valider`, `marketing:segment:gerer`, `marketing:audience:consulter`. Format conforme. |
| C8 | `/marketing` (vue opérateur, vue DG), `CombosStockPanel`. Menus : « Campagnes » (`marketing:campagne:gerer`), « Combos » (`marketing:combo:proposer`), « Mon audience » (`marketing:audience:consulter`). « Lancer », « Modifier », « Ignorer » doivent aboutir pour le circuit combos stock en février ; le chatbot WhatsApp : « bientôt ». |
| C9 | Rien supprimé ; campagnes conservées. Avertissement : « Les campagnes en cours ne seront plus envoyées. » |
| C10 | `profiles: ["marketing"]` ; socle + `pdv` + `notification` + `reseau`. |
| C11 | `ia: { modeles: ['scoring-leads', 'segmentation-comportementale'], finalites: ['ciblage-campagne', 'segmentation'] }` [ASSUMPTION]. |
| C12 | `SANS_PERTE`. Interrupteurs : `exclusion-clients-en-defaut` (active par défaut, jamais éteinte en silence), `validation-dg-combos`. |
| C13 | Prérequis : `notification` canal utilisable. Vérification : `audience-resolue` (🟢 si l'audience d'essai se résout et les exclusions sont comptées). Essai : aucun message réel. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.13 Contrôle de gestion (`controle-gestion`, M25)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'controle-gestion'` (**code à tiret**), `1.0.0`. Distributeur ; microfinance [À CONFIRMER, M25]. `depends: []`. `enrichiPar: [facturation (réel), commande, stock (coût), reseau (axes zone), finance-transactions, notification (envoi de rapports)]`. Hors bundle (écart d'offre, §4.5). |
| C2 | Gate `CONTROLE_GESTION_NOT_ENTITLED`. `organisationId` ; poste exclusif (le contrôleur de gestion n'arbitre ni la trésorerie ni le crédit). |
| C3 | Budgets par axe (zone, canal, famille), versions, atterrissage, forecast glissant 3 mois, rapports préparés et envoyés. |
| C4 | Réel absent (`facturation`, `commande`) : colonne réel = `NON_INSTALLE` ; budget seul reste utilisable. |
| C5 | Publie `controle-gestion.rapport.envoye@1`, `controle-gestion.budget.fige@1`. Consomme `facturation.facture.emise@1`, `reseau.noeud.created@1`, `stock.valorisation.publiee@1`. |
| C6 | Axes d'analyse, bande d'alerte (±3 %), modèles de rapport. |
| C7 | `controle-gestion:budget:fixer`, `controle-gestion:budget:consulter`, `controle-gestion:rapport:envoyer`, `controle-gestion:prevision:gerer` (forme élargie). |
| C8 | `/controle-gestion` (6 onglets), boîte de rapports chez DG/DAF. Menus : « Budgets » (`…:budget:consulter`), « Rapports » (`…:rapport:envoyer`). |
| C9 | Rien supprimé ; budgets conservés. Avertissement : « Les budgets ne seront plus comparés au réel. » |
| C10 | `profiles: ["controle-gestion"]` ; socle seul. |
| C11 | `ia: { modeles: ['synthese-ecarts'], finalites: ['explication-des-ecarts', 'alerte-de-bande'] }` [ASSUMPTION]. |
| C12 | `SANS_PERTE`. Interrupteur : `envoi-automatique-rapports`. |
| C13 | Prérequis : aucun module. Vérification : `budget-charge` (🟢 si ≥ 1 budget). Lecture seule : consultation, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.14 Automatisations (`automatisations`, M26)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'automatisations'`, `1.0.0`. `depends: []`. `enrichiPar: [recouvrement, marketing, stock, approvisionnement, commande, notification, dashboard]`. Porté par `assistant-service` [À CONFIRMER, M26]. |
| C2 | Gate `AUTOMATISATIONS_NOT_ENTITLED`. `organisationId` ; une règle ne s'exécute que sur les données que son auteur peut lire. |
| C3 | Règles (grammaire fermée : grandeur × comparateur × seuil × état), niveaux AUTO / À VALIDER / SUGGESTION, file d'arbitrage, journal « cette nuit ». |
| C4 | Un module source absent désactive ses règles, avec `NON_INSTALLE` à l'écran ; la règle n'est pas supprimée. |
| C5 | Publie `automatisations.cible.decidee@1`, `automatisations.regle.changed@1`. Consomme les faits des modules sources (`recouvrement.dossier.changed@1`, `stock.alerte.changed@1`, `commande.commande.validee@1`, `marketing.campagne.changed@1`). |
| C6 | Règles = données à grammaire fermée, sans `eval` ; garde-fous explicites (plafond de crédit, plancher de trésorerie, remise maximale). |
| C7 | `automatisations:regle:gerer`, `automatisations:regle:activer`, `automatisations:cible:valider`, `automatisations:journal:consulter`. Format conforme. |
| C8 | `/automatisations`, « cette nuit » dans trois cockpits. « Valider » et « Reporter » doivent persister en février. |
| C9 | Rien supprimé ; règles et journal conservés mais **suspendus** (aucune exécution). Avertissement : « Plus aucune règle ne s'exécutera. » |
| C10 | `profiles: ["automatisations"]` ; socle seul. |
| C11 | Sans objet : le centre de règles n'embarque aucun modèle ; les modèles vivent dans les modules producteurs de cibles (C11 de chacun) et ce module journalise leurs sorties et les décisions humaines. Si un orchestrateur appris est ajouté, `ia` sera déclaré. |
| C12 | `SANS_PERTE`. Interrupteur : `orchestration-nocturne`. |
| C13 | Prérequis : au moins un module source [ASSUMPTION]. Vérification : `regles-valides` (🟢 si 100 % des règles respectent la grammaire fermée). Essai : les règles ne produisent aucune action réelle (interceptées). `objetsDeReprise: []`, `domainesEchange: []`. |

### A.15 Tableau de bord et pilotage (`dashboard`, M28)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'dashboard'`, `1.0.0`. Quatre verticales. `depends: []`. `enrichiPar:` tous les modules du distributeur (`commande`, `facturation`, `stock`, `pdv`, `recouvrement`, `terrain`, `paiement`, …). Code au catalogue, déprécié, à réactiver. Aucun module n'en dépend en dur. |
| C2 | Gate `DASHBOARD_NOT_ENTITLED`. `organisationId` et portée : chaque rôle ne reçoit que les cartes que ses droits sur les modules sources autorisent. |
| C3 | Définitions de cartes et de KPI par rôle, alertes du jour, décisions à trancher (état), rapports de direction générés, scores publiés (santé PDV, FR-184). Pas de copie des données des autres modules (agrégation à la demande). |
| C4 | Chaque carte dont la source est absente = `NON_INSTALLE` ; un cockpit s'affiche avec ses seules cartes disponibles. |
| C5 | Publie `dashboard.decision.tranchee@1`, `dashboard.rapport.genere@1`, `dashboard.score-pdv.calcule@1`. Consomme les faits des modules sources, `etat-publie.changed.*@1`. |
| C6 | Cartes par rôle (en donnée), seuils d'alerte, huit chiffres du DG, modèle du rapport. |
| C7 | `dashboard:tableau:consulter`, `dashboard:vue-direction:consulter`, `dashboard:decision:trancher`, `dashboard:rapport:envoyer`, `dashboard:alerte:configurer`. Format conforme. |
| C8 | `/dashboard` (15 cockpits par rôle), rapport IA. Le DG « voit tout » ; une carte « Vue DG » est conditionnée par `dashboard:vue-direction:consulter` (FR-186). Boutons « PDF », « Envoyer », décisions « Valider » / « Reporter » doivent aboutir en février. |
| C9 | Rien supprimé ; définitions et décisions conservées. Avertissement : « Les tableaux de bord disparaissent du menu ; aucune donnée métier n'est touchée. » |
| C10 | `profiles: ["dashboard"]` ; socle seul. |
| C11 | `ia: { modeles: ['synthese-narrative', 'prevision-ca', 'scoring-sante-pdv'], finalites: ['rapport-de-direction', 'prevision-ca-trimestrielle', 'score-de-sante'] }` [ASSUMPTION : le « Copilot conversationnel » de l'offre n'a pas d'écran dans la démo]. Tout score porte source, date et version (FR-184). |
| C12 | `SANS_PERTE`. Interrupteurs : `rapport-ia-quotidien`, `scoring-sante-pdv`. |
| C13 | Prérequis : aucun module obligatoire. Vérification : `cartes-resolues` (🟢 si ≥ 80 % des cartes d'un cockpit d'essai se résolvent, les autres affichant `NON_INSTALLE`). Lecture seule : tous les cockpits, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.16 Support client et CRM interne (`support-client`, M03)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'support-client'` (**code à tiret**), `1.0.0`. Quatre verticales [À CONFIRMER, M03], service `support-crm-service` à créer. `depends: []`. `enrichiPar: [pdv (fiche client), commande, facturation, entrepot (litiges de livraison), notification]` [ASSUMPTION]. **Aucune source du distributeur ne décrit ce module** : la démo n'a pas d'écran de support. Il est inscrit pour la complétude des seize modules. |
| C2 | Gate `SUPPORT_CLIENT_NOT_ENTITLED`. `organisationId`. |
| C3 | Dossiers de support (réclamation, litige de livraison, facture contestée), échanges, statuts [ASSUMPTION]. |
| C4 | Chaque module lié absent : lien du dossier = `NON_INSTALLE`. |
| C5 | Publie `support-client.dossier.changed@1`. Consomme `pdv.point-de-vente.changed@1`, `commande.commande.changed@1`, `facturation.facture.changed@1`. |
| C6 | Types de dossier, délais de réponse, modèles de réponse. |
| C7 | `support-client:dossier:ouvrir`, `support-client:dossier:traiter`, `support-client:dossier:cloturer`. |
| C8 | Aucun écran dans la démo : écrans **à concevoir**, hors périmètre de février [ASSUMPTION]. |
| C9 | Rien supprimé ; dossiers conservés. Avertissement : « Les dossiers ouverts ne seront plus suivis. » |
| C10 | `profiles: ["support-client"]` ; socle seul. |
| C11 | Sans objet : aucun modèle n'est promis par l'offre pour ce module ; tout résumé automatique de dossier ouvrirait la clause. |
| C12 | `SANS_PERTE`. `interrupteurs: []`. |
| C13 | Prérequis : aucun. Vérification : `dossier-cree` (🟢 si un dossier d'essai se crée et se relit). Lecture seule : consultation, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.17 Les huit modules de la partie 4 : renvoi aux manifestes

Ces huit modules ont déjà leurs treize clauses dans leur manifeste. Ce PRD **ne les répète pas** ; il renvoie.

| Module | Manifeste | Dépend de (dures) | Enrichi par | Objets de reprise | Domaines d'échange | Point à reporter |
|---|---|---|---|---|---|---|
| `reseau` | `manifestes/reseau.manifest.ts` | aucune | `pdv`, `stock` | `reseau.zone@1`, `reseau.commercial@1` | `reseau.commerciaux` | FR-180 à FR-183 |
| `pdv` | `manifestes/pdv.manifest.ts` | `reseau` | `stock`, `commande`, `facturation`, `terrain`, `recouvrement`, `catalogue` | `pdv.point-de-vente@1`, `pdv.affectation@1` | `pdv.points-de-vente` | FR-184 à FR-192 ; prérequis `fond-de-carte` (Google Maps) |
| `catalogue` | `manifestes/catalogue.manifest.ts` | aucune | `reseau`, `pdv`, `stock`, `commande` | `catalogue.article@1`, `catalogue.grille@1` | `catalogue.articles`, `catalogue.prix` | FR-193 à FR-198 ; grille « point de vente » |
| `stock` | `manifestes/stock.manifest.ts` | `catalogue` | `balance`, `commande`, `pdv`, `reseau`, `terrain` | `stock.point-de-stock@1`, `stock.stock-ouverture@1` | `stock.mouvements`, `stock.disponible` | FR-199 à FR-204 |
| `paiement` | `manifestes/paiement.manifest.ts` | aucune | `notification`, `facturation` | aucun | `paiement.encaissements` | FR-205 à FR-210 ; droits d'ordre à rendre lisibles (`paiement:ordre:*` [À CONFIRMER]) |
| `notification` | `manifestes/notification.manifest.ts` | aucune | aucun | aucun | aucun | FR-211 à FR-214 |
| `reprise` | `manifestes/reprise.manifest.ts` | aucune | `pdv`, `catalogue`, `reseau`, `stock`, `facturation`, `assurance`, `sinistres` | aucun | aucun | FR-215 à FR-217 ; **ajouter `approvisionnement` à `enrichiPar`** (fournisseurs) |
| `connecteurs` | `manifestes/connecteurs.manifest.ts` | aucune | `reprise`, `pdv`, `catalogue`, `stock`, `facturation`, `pi-spi`, `approvisionnement` | aucun | aucun | FR-218, FR-219 ; **remplacer `pi-spi` par `paiement`** dans `enrichiPar` |

#### Problèmes de contrat repérés (à lire avant de les corriger)

1. **Codes à tiret.** `conquete-objectifs`, `studio-social`, `controle-gestion`, `finance-transactions` et `support-client` ne passent pas le format de droit actuel d'`auth-service`. La story d'élargissement (amendement C7 du 2026-11-11) doit se livrer **avant la semaine 5** ; sans elle, les cinq modules ne peuvent pas déclarer un seul droit.
2. **Aucun cycle de dépendance dure** dans le graphe proposé (préambule). Les liens retour sont tous des `enrichiPar` (`pdv` → `commande`, `stock` → `commande`, `catalogue` → `stock`…), ce que le contrat autorise ; le catalogue de modules les valide tout de même au `MANIFESTE_CYCLE`.
3. **`pi-spi` dans `Connecteurs.enrichiPar`** contredit la décision du PO : le module s'appelle `paiement`. À corriger au manifeste `connecteurs`.
4. **`approvisionnement` absent de `reprise.enrichiPar`** alors que la spine y place la reprise des fournisseurs. À ajouter au manifeste `reprise`.
5. **`facturation` est la cible de reprise des factures impayées** (`facturation.facture-ouverte@1` proposé) ; aucun manifeste `facturation` n'existe aujourd'hui (dû le 20/11, lot 2). La reprise des créances n'a donc **pas de cible codée** tant qu'il n'existe pas ; `paiement.objetsDeReprise` reste `[]`.
6. **`domainesEchange` d'argent** (`facturation.factures`, `paiement.encaissements`) : chaque domaine d'argent déclare `controle: true` et ses valeurs de contrôle. La règle du point d'écriture unique par domaine vaut dès la construction, même si Connecteurs est hors février.
7. **`commande` → `catalogue` et `pdv`** (dépendances dures) est une `[ASSUMPTION]` ; `pdv` et `catalogue` listent déjà `commande` en `enrichiPar`, donc il n'y a pas de cycle, mais une commande sans `pdv` (vente comptoir anonyme) ne serait pas possible.
8. **`terrain` et `recouvrement`** servent deux verticales : leurs dépendances dures ne doivent pas nommer un module d'une seule verticale (`terrain` ne dépend que de `reseau`, `recouvrement` de `paiement` et `notification`) ; les sources propres à une verticale passent par `enrichiPar`.
9. **Service porteur de `facturation`** : `paiement-service` (arrêté → créance) et un service `facturation` [À CONFIRMER]. Deux modules dans un même service ne partagent pas de collection qu'ils écrivent tous deux (contrat §4).
10. **`freelance` est un add-on, pas un module** (M42, à confirmer) : si la décision est « option de pack », les lignes A.7 deviennent des droits et un profil de `catalogue` et `pdv`, et le manifeste disparaît.
