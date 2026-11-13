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

*Brouillon rédigé en mode rapide le 2026-11-12, à partir du texte du PO (`brain-dump-po-2026-11-12.md`), de la 19ᵉ séance de la table ronde, et de cinq extraits du front de démo et des PRD existants (`extract-*.md`). Décisions et raisons dans `.memlog.md`. **Corrigé le même jour après réconciliation avec les sources du PO et avec la démo, puis après deux relectures (grille de qualité, relecture adversariale) : les rapports sont dans ce dossier (`reconcile-*.md`, `review-*.md`, `triage-hypotheses-*.md`, `corrections.md`).** Les hypothèses sont triées : les unes sont confirmées, les autres deviennent des valeurs par défaut modifiables. Les douze questions posées au PO (Q1 à Q12) ont été tranchées le 2026-11-12 ; elles s'écrivent comme des décisions, rassemblées au §12.*

---

## 0. Objet du document

Ce PRD décrit **Prospera Distributeur** : l'outil qui pilote un distributeur ou un grossiste au Togo et dans l'UEMOA, du terrain à la finance. Il s'adresse au PO, à Dev A et Dev B, et aux auteurs des PRD microfinance et assurance, qui s'écrivent juste après lui.

**Sa source est le front de démo** `prospera-font-end/prospera-distributeur` (23 écrans, environ 47 600 lignes). Le PO l'a décidé : ce que la démo présente, le produit doit le faire. Mais la démo n'enregistre rien. Elle n'a ni serveur ni base de données, ses indicateurs sont souvent des constantes, et sur les 36 boutons d'action relevés par l'audit de juillet 2026, aucun n'agit vraiment. L'analyse et les rapports de la démo sont riches et propres à chaque rôle ; la partie qui sert à agir manque. **Ce PRD exige donc tout ce que la démo montre, en vrai** : enregistré, relu par les autres rôles, calculé depuis les données saisies. La démo sert aussi de maquette : il n'y a pas de maquettes séparées.

Le brain dump du PO parle de 18 modules en 4 bundles ; la démo présente 20 modules en 4 familles. Ce PRD suit les 20 modules de la démo ; le découpage en offres est une affaire commerciale, dont le PRD ne dépend pas (§12).

**Modules ★ (besoins du client de février).** Sept modules servent ses besoins du premier jour, et un huitième sert la tournée finie : `commande`, `facturation`, `paiement` (encaissements), `recouvrement`, `pdv`, `catalogue`, `stock`, et `terrain` (parcours UJ-2). Ils portent ★ dans les parties 2 à 4.

Le document est **unique** (décision du PO) et se lit en quatre parties :

| Partie | Contenu | Sections |
|---|---|---|
| **1. Le produit et ses deux moments** | vision, rôles, les parcours (dont les deux parcours n° 1), le jeu de démonstration, l'essai du prospect, les règles transverses (tout s'enregistre, boutons « bientôt », périmètres, garde-fous, chiffres vrais) | §1 à §4 |
| **2. Les modules propres au distributeur** | commande, facturation, approvisionnement, entrepôt, conquête et objectifs, studio réseaux sociaux, add-on Freelance | §5 |
| **3. Les modules partagés avec la microfinance** | écrits **une fois, neutres de verticale** : un noyau commun, puis un tableau de vocabulaire par verticale. Les PRD microfinance et assurance y renvoient au lieu de les réécrire | §6 |
| **4. Les modules déjà cadrés** | fiches de renvoi vers réseau, points de vente, catalogue, stock, paiement, notification, Reprise et Connecteurs, avec ce que la démo exige en plus | §7 |

Suivent les exigences transverses (§8), les indicateurs de réussite (§9), le périmètre (§10), les non-objectifs (§11), les décisions prises, les actions qui restent au PO et les risques assumés (§12), les hypothèses restantes (§13, régénéré après assemblage), et en **annexe A** les 13 lignes du contrat de module pour chaque module ; l'**annexe B** donne la table d'accès (rôles × écrans, rôles × droits).

**Sources.** Le front de démo `prospera-font-end/prospera-distributeur` et ses documents (inventaire, audit de juillet 2026, spécification V2, grille de prix, documents de modules et de bundles, fiches personas, guide) ; le brain dump du PO ; le journal des décisions `.memlog.md` ; les PRD existants listés en en-tête.

**Numérotation des exigences.** FR-1 à FR-29 : partie 1 (FR-20 à FR-25 ajoutés à la correction ; FR-26 à FR-29 libres). FR-30 à FR-99 : partie 2 (ajouts FR-220 à FR-239). FR-100 à FR-179 : partie 3 (ajouts FR-172 à FR-179). FR-180 à FR-219 : partie 4 (ajouts FR-240 à FR-259). Les numéros sont stables : une exigence retirée garde son numéro, barré, et un ajout prend toujours un numéro libre. Le décompte total est refait à l'assemblage. Les exigences des autres PRD se citent avec leur préfixe (`FR-C14`, `FR-P10`, `Reprise FR-9`, `Connecteurs FR-17`).

**Comment il a été écrit et corrigé.** Mode rapide : la partie 1 par l'animateur ; les parties 2, 3 et 4 par trois rédacteurs à partir des extraits, avec le vocabulaire et les plages de numéros imposés, puis assemblées. Le brouillon a ensuite été **corrigé après réconciliation** avec le texte du PO et avec la démo, et après deux relectures ; une feuille d'arbitrage (`corrections.md`) a tranché les conflits entre rapports, puis le PO a répondu aux douze questions. Le §12 rassemble ses décisions, les actions qui lui restent et les risques assumés.

---

## 1. Vision

Un grossiste de Lomé vend chaque jour à des centaines de boutiques par une douzaine de commerciaux, sort ses camions de deux entrepôts, et court après son argent. Aujourd'hui, il tient tout cela dans Sage, dans des cahiers et dans WhatsApp. Il ne sait pas, le soir, ce que ses commerciaux ont vraiment encaissé, ni quel client va payer, ni quel produit va manquer.

**Prospera Distributeur met tout le métier dans un seul outil, par rôle.** Le commercial déroule sa tournée sur son téléphone, même sans réseau, et sa commande arrive au bureau avec le stock vérifié. La facture sort juste, numérotée, avec la TVA, et part en PDF. Le client paie une partie par FedaPay ou par PI-SPI, et la balance âgée le sait aussitôt. La relance part au bon moment par le bon canal. Le DG ouvre lundi matin huit chiffres vrais et tranche les décisions qui l'attendent.

**Ce qui le distingue** : chaque rôle a son écran et ses chiffres, et la machine prépare le travail la nuit (réappro, relances, combos d'écoulement) sans jamais décider à la place d'un humain là où l'argent est en jeu. Une seule exception, écrite et auditée : le blocage du crédit d'un client en retard, que seul le DAF peut lever.

**Pourquoi maintenant.** Un premier client, un grossiste en pré-contrat qui quitte Sage, doit démarrer en février 2027 sur les serveurs de Money Vibes. La démo a déjà convaincu ; il faut maintenant qu'elle **fasse ce qu'elle montre**. Et chaque prospect qui ouvrira un essai le 15/01 testera lui-même le produit.

**Le chantier n° 1 est le serveur et la base de données** : sans eux, aucun des besoins du premier jour ne fonctionne (FR-1). Les deux parcours n° 1 n'attendent rien de « bientôt » : l'envoi de la facture par WhatsApp et l'application terrain hors connexion sont exigés (FR-20 à FR-24).

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
| `FREELANCE` | Commercial freelance | vend pour le compte de la société (sans acheter de stock), facture son détaillant à son propre prix, reçoit une commission calculée sur le prix société ; sa marge de négociation est à lui et invisible de la société ; il doit le prix société à la société même si son détaillant ne paie pas |
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

**Pas de rôle fantôme.** Les exigences ne parlent que de ces 15 rôles. Saisir une commande au bureau : tout rôle qui en a le droit (`DC`, `RESP_VENTES`, `COMMERCIAL`, `COMPTABLE`). Créer et émettre une facture : `COMPTABLE` et `DAF`. Confirmer une livraison : `GEST_ENTREPOT` ou l'agent de terrain. Le magasinier est `GEST_ENTREPOT`. Le préparateur de commandes et le camion sont des données de l'organisation, pas des rôles.

### 2.2 Hors cible (v1)

- **Les points de vente eux-mêmes** (les détaillants) n'ont pas de compte. Ils reçoivent un message, un PDF ou un lien de paiement, et peuvent commander par WhatsApp, sans se connecter.
- **Le client final** (le consommateur) n'est pas dans le produit.
- **Le distributeur qui garde son logiciel** (Odoo) relève de Connecteurs, hors février.

### 2.3 Parcours clés

Les deux premiers sont les **deux moments qui comptent**, à égalité (décision du PO) : la première facture juste, et la première tournée finie. Ni l'un ni l'autre ne s'appuie sur une fonction « bientôt ».

> **UJ-1. La facture juste.**
> Lundi 8 h, Akossiwa, comptable du Grossiste du Golfe, saisit la commande de la boutique de Mme Adjo à Adidogomé : 20 cartons de jus d'orange 1 L, 10 packs de cola 33 cl. Prospera vérifie le stock à Lomé Port et le **réserve**. Elle valide ; le **bon de livraison** sort, le camion part. Mercredi, à la livraison confirmée, elle transforme la commande en **facture en un clic**, sur les quantités livrées : numéro suivant, sans trou, mentions légales, TVA 18 %. Le PDF part sur le WhatsApp de Mme Adjo. Le soir, Mme Adjo paie la moitié par **FedaPay** ; la facture passe « partiellement payée ». Le lendemain de l'échéance, un rappel part par WhatsApp. Passé 30 jours de retard, la **balance âgée** la classe dans la tranche 31-60 jours, la direction est alertée, et le **DG** la voit dans son rapport du mois. **Cas limites :** si l'encours de Mme Adjo dépasse son plafond de crédit, ou si son crédit est bloqué, la validation de la commande est refusée avec le motif, et le DAF peut accorder une dérogation tracée. Si Mme Adjo avait payé un acompte avant la facture, il serait tenu comme crédit à son nom, puis imputé à la facture.
> *Réalisé par FR-1, FR-9 à FR-13, FR-17, FR-20 à FR-24 et les parties 2 et 3.*

> **UJ-2. La tournée finie.**
> Kodjo, commercial à Bè, ouvre l'application sur son Android d'entrée de gamme. Son plan de journée compte 14 visites. Il appuie sur **« Y aller »**, arrive chez un détaillant, vérifie la disponibilité des produits (sans voir les quantités), prend une commande au panier, encaisse 35 000 F en espèces, et **clôture** la visite, à moins de 200 m du point de vente. Hors du rayon, la clôture reste possible, avec un motif obligatoire ; le superviseur en est prévenu. Le réseau coupe à la 9ᵉ visite : il continue. Le soir, au retour du réseau, tout part : les commandes arrivent « en attente de confirmation du stock », les espèces portent leur clé et ne comptent qu'une fois. Il fait sa **remise d'espèces** au superviseur. **Cas limites :** une commande saisie hors connexion sur un produit vendu entre-temps revient « stock insuffisant » et Kodjo est prévenu. Les 35 000 F encaissés avant toute facture sont tenus comme crédit du client, imputés à sa facture dès qu'elle existe.
> *Réalisé par FR-1, FR-9 à FR-13, FR-20 à FR-23, FR-25 et la partie 3 (terrain).*

> **UJ-3. Le superviseur voit vrai.** Yawa, superviseure de Lomé Centre, voit la tournée de Kodjo telle qu'elle s'est passée : visites faites, commandes prises, espèces déclarées, **écart de caisse réel** entre ce qui est déclaré et ce qui est remis, clôtures hors rayon avec leur motif. Elle ne voit que ses commerciaux.

> **UJ-4. La file du jour.** Mensah, au recouvrement, ouvre sa file triée par ce qu'elle rapporte. Il envoie une relance WhatsApp et enregistre une promesse de paiement au 20. Un autre client a une créance échue depuis plus de 60 jours : son crédit est bloqué automatiquement, sa prochaine commande sera refusée, et seul le DAF peut le débloquer.

> **UJ-5. Le lundi du DG.** Ayité, DG du Grossiste du Golfe, lit ses 8 chiffres, ouvre les décisions à trancher, en valide deux et en reporte une, avec la trace. Il télécharge le rapport de direction en PDF et l'envoie au DAF.

> **UJ-6. Le réappro qui ne vide pas la caisse.** Komlan, responsable stock, voit trois réappros proposés. Il prépare une commande fournisseur de 18 M ; au-delà de son plafond de 5 M, elle passe au DAF, qui la valide parce que la trésorerie reste au-dessus du plancher. À la réception, un écart de 6 % ouvre un litige, et le stock est corrigé de ce qui est réellement arrivé.

> **UJ-7. L'ouverture qui tient.** Afi, chargée de prospection, recense une boutique en zone blanche, obtient une première commande sous le garde-fou de 1,5 M, puis la transfère au commercial du secteur. Un mois plus tard, puis trois, l'outil dit si l'ouverture tient.

> **UJ-8. Le prospect qui essaie.** Le 15/01, un prospect ouvre son essai avec le jeu « Grossiste du Golfe ». Il se connecte tour à tour avec le compte d'Akossiwa, de Kodjo, de Mensah, installe l'application terrain sur un téléphone, joue UJ-1 et UJ-2 lui-même, sans aide, ajoute ses propres articles, et recharge la page : tout est toujours là.
> *Réalisé par FR-2, FR-9 à FR-12 et FR-20 à FR-24.*

> **UJ-9. Le freelance qui négocie.** Ama, commerciale freelance, vend des cartons de jus dont le prix société est de 14 000 F, servis par le stock de la société. Elle facture son détaillant 15 000 F. La société ne voit que 14 000 F et verse à Ama une commission calculée sur 14 000 F. Les 1 000 F de négociation sont à Ama et personne d'autre ne les voit. Elle doit 14 000 F à la société même si son détaillant ne la paie pas. **Cas limite :** le détaillant ne paie pas ; la dette de 14 000 F d'Ama envers la société et sa commission ne changent pas. Décision du PO du 2026-11-12 : le freelance vend pour le compte de la société ; il n'achète pas de stock, qui reste à la société jusqu'à la livraison au détaillant.
> *Réalisé par FR-8 et FR-93 à FR-99.*

---

## 3. Vocabulaire

Les termes ci-dessous s'emploient tels quels dans tout le PRD et dans les documents qui en descendent. Les parties 3 et suivantes ajoutent leur vocabulaire par verticale.

- **Organisation** : le distributeur client de Prospera. Toutes les données lui appartiennent et en sont cloisonnées.
- **Rôle** : l'un des 15 rôles du §2.1 (14 rôles métier et l'administrateur). Un utilisateur en a un.
- **Périmètre** : la part des données qu'un utilisateur voit et modifie : tout, une région, une zone, un portefeuille (ses points de vente), ou un entrepôt.
- **Point de vente** : le détaillant (boutique, kiosque, supermarché) à qui le distributeur vend. Il porte un plafond de crédit et des conditions de règlement. Un **prospect** est un point de vente à l'état `PROSPECT` ; sa première commande passe sous le garde-fou de 1,5 M.
- **Tiers** : terme du noyau partagé (partie 3) pour celui qui doit de l'argent : le point de vente chez le distributeur, le membre à l'IMF.
- **Agent de terrain** : terme du noyau partagé pour celui qui visite : le commercial, le freelance, le chargé de prospection chez le distributeur.
- **Lieu** et **Zone** : un lieu a une adresse (entrepôt, agence, boutique) ; une zone est un périmètre commercial sans mur (PRD réseau).
- **Article** : un produit du catalogue, avec son unité de base et ses conditionnements (bouteille, pack, carton).
- **Grille de prix** : le prix société (grille non modifiable ; jamais appelé « coût d'achat »), le prix du freelance à son détaillant (privé), et le prix négocié avec un point de vente.
- **Client** : dans la partie 2, synonyme de point de vente ; dans la partie 3, c'est un tiers.
- **Devis** : synonyme de proforma ; le produit n'a pas d'objet devis distinct.
- **Quantité livrée** : la quantité dont la livraison est confirmée ; la facture porte les quantités livrées.
- **Commande** et **Ligne de commande** : ce qu'un point de vente achète, article par article.
- **Stock réservé** : la quantité qu'une commande validée bloque dans un point de stock.
- **Point de stock** : un entrepôt ou un dépôt (Lomé Port, Kara).
- **Bon de livraison** : le document émis à la validation d'une commande, sur lequel le camion sort de l'usine ou de l'entrepôt et qui accompagne la marchandise ; le terrain l'appelle aussi « bon de commande ». Signé, il devient la preuve de livraison. La facture naît à la livraison, sur les quantités livrées. La commande faite au fournisseur ne s'appelle jamais « bon de commande » : c'est la **commande fournisseur**.
- **Facture**, **Avoir**, **Proforma**, **E-facture** : les documents commerciaux de la partie 2.
- **Créance** : ce qu'un tiers doit. Une facture en ouvre une ; à l'IMF, une échéance de prêt en ouvre une. **Source de créance** : ce qui l'a ouverte.
- **Encaissement** : un paiement reçu, par un **moyen de paiement** : PI-SPI, FedaPay (paiement mobile compris), espèces ou virement déclarés. Les encaissements appartiennent au module `paiement`.
- **Crédit du tiers** : l'argent reçu qui n'a pas (encore) de créance (avance, acompte, trop-perçu, avoir sur une facture payée). Il est tenu par `paiement`, puis imputé : sur la créance désignée, sinon sur la plus ancienne créance échue. Un paiement déjà reçu n'est jamais refusé.
- **Encours** : ce qu'un tiers engage auprès du distributeur = créances ouvertes + commandes validées non encore facturées − crédit du tiers.
- **Blocage du crédit** : état d'un tiers dont toute nouvelle commande est refusée. Il se pose automatiquement (créance échue depuis plus de 60 jours, ou encours au-dessus du plafond) et ne se lève jamais seul : seul le DAF le lève.
- **Remise d'espèces** et **Écart de caisse** : ce qu'un agent de terrain remet de ce qu'il a encaissé, et la différence avec ce qu'il a déclaré.
- **Balance âgée** : les créances ouvertes rangées par ancienneté.
- **Plafond de crédit** : le montant d'encours au-delà duquel une nouvelle commande est refusée.
- **Dossier de recouvrement**, **Promesse** : partie 3.
- **Visite**, **Tournée** : une visite est un passage chez un point de vente ; une tournée est le plan de visites d'une journée.
- **Ouverture**, **Passation** : la première commande d'un prospect, et son transfert au commercial du secteur.
- **Commande fournisseur**, **Réception**, **Litige**, **Inventaire** : partie 2.
- **Objectif** : un montant ou une quantité attendus sur une période, pour une zone, un agent de terrain ou un point de vente.
- **KPI de poste** : les 4 à 5 indicateurs pondérés d'un rôle, avec score sur 100.
- **Garde-fou** : un paramètre de l'organisation qui **bloque** une action (plafond de crédit, plancher de trésorerie, remise maximale, plafond de validation).
- **Alerte** : un fait signalé à un rôle. **Décision à trancher** : une demande qui attend un humain, avec un choix enregistré.
- **Règle d'automatisation** : partie 3.
- **Bouton « bientôt »** : un bouton visible mais inactif, qui dit seulement ce qu'il fera, sans date.
- **Jeu de démonstration** : les données de test réalistes du §4.3.

---

## 4. Partie 1 — Les règles transverses

Ces exigences valent pour **tous** les modules des parties 2, 3 et 4.

### 4.1 Tout s'enregistre

**Ce que ça veut dire.** La démo affiche, calcule et simule. Le produit enregistre. Une action faite par un rôle est relue par les autres rôles, après rechargement, sur un autre appareil.

#### FR-1 : Chaque action est enregistrée côté serveur

Tout bouton d'action d'un écran crée ou modifie un objet enregistré côté serveur, dans l'organisation de l'utilisateur. Réalise UJ-1 à UJ-9.

**Conséquences (testables) :**
- Après l'action, recharger la page, se déconnecter, ou ouvrir l'écran depuis un autre appareil rend le même état.
- L'objet modifié est visible par les autres rôles dont le périmètre le couvre en moins de 5 secondes en connexion normale, et en moins d'une minute après une resynchronisation hors connexion.
- Aucune donnée métier n'est conservée dans le stockage du navigateur ; seules des préférences d'affichage peuvent l'être.

#### FR-2 : Les boutons pas encore branchés sont « bientôt »

Un bouton dont la capacité n'est pas encore livrée s'affiche **« bientôt »**, sans date (décision du PO du 2026-11-12 : « on va voir en évoluant »), et ne fait rien d'autre qu'expliquer ce qu'il fera. Aucun bouton ne simule un effet.

**Conséquences (testables) :**
- Un inventaire des boutons d'action, tenu avec le produit, donne pour chacun : écran, libellé, état (`BRANCHÉ` ou `BIENTÔT`), exigence qui le branche.
- Un test parcourt chaque écran et échoue si un bouton n'est ni branché ni marqué « bientôt ».
- Un bouton « bientôt » n'affiche jamais de date promise au client, et aucun ordre de livraison n'est figé.
- Ne sont jamais « bientôt » : l'envoi de la facture par WhatsApp et l'application terrain hors connexion, exigés par les deux parcours n° 1 (FR-20 à FR-24).

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
- La table de la démo (`route-access.ts`) est le point de départ, corrigée par FR-6 à FR-8 ; elle est reprise à l'annexe B (rôles × écrans, et par module rôles × droits). Les fiches personas et la spec V2, périmées, ne font pas foi.
- Le libellé d'un écran dans le menu (« Mes clients », « Mon portefeuille », « Mes ouvertures ») est une donnée de la table, pas du code.

#### FR-6 : Chacun voit son périmètre, appliqué par le serveur

Les données sont filtrées côté serveur selon le périmètre : le commercial, le freelance et le chargé de prospection ne voient que **leur** portefeuille ; le superviseur et le responsable des ventes, leur zone ou leur région ; le gestionnaire d'entrepôt, son entrepôt.

**Conséquences (testables) :**
- Un commercial qui saisit l'adresse de la fiche d'un point de vente hors de son portefeuille obtient « introuvable », comme pour un point de vente inexistant.
- Le superviseur de Lomé Centre ne voit, sur `/commercial`, `/tournees` et `/equipe`, que les agents de sa zone.
- Le gestionnaire d'entrepôt de Kara ne voit ni ne modifie le stock de Lomé Port.
- Un filtre vide ne retombe jamais sur « toute l'organisation ».
- Assiette par rôle : tout le réseau pour `DG`, `DC`, `DAF`, `COMPTABLE`, `CONTROLE_GESTION`, `RESP_STOCK`, `MARKETING`, `RECOUVREMENT` ; sa région pour `RESP_VENTES` ; sa zone pour `SUPERVISEUR` ; son portefeuille pour `COMMERCIAL`, `FREELANCE`, `PROSPECTION` ; son entrepôt pour `GEST_ENTREPOT`. `MARKETING` et `RECOUVREMENT` lisent le réseau sans CA ni créance détaillés hors de leur besoin (FR-7).

#### FR-7 : Chaque rôle a sa vue, pas la vue du DG

Un écran partagé par plusieurs rôles rend la vue du rôle connecté. La mention « Vue DG », le classement de zone et les priorités du DG ne s'affichent qu'au DG et au DC.

**Conséquences (testables) :**
- La fiche d'un point de vente vue par un commercial montre sa dernière visite, ses relances en cours (quatre au plus) et son objectif du mois.
- Le marketing et le recouvrement ne voient pas la liste des points de vente sous l'étiquette « Vue DG ».

#### FR-8 : Les données privées restent privées

La marge de négociation du freelance (l'écart entre son prix et le prix société) n'est visible que de lui. Les rémunérations et commissions d'un agent ne sont visibles que de lui-même et des rôles qui ont ce droit explicite : par défaut la direction (DG, DC, DAF). La commission du freelance se calcule sur le prix société de ses ventes facturées ; celle des salariés, sur l'encaissé (décision du PO du 2026-11-12, Q8).

**Conséquences (testables) :**
- Aucun écran ni aucune réponse d'API ne rend la marge d'un freelance à un autre rôle que lui.
- Le score de poste d'un freelance vu de la société ne dépend jamais de sa marge : faire varier sa marge à chiffre d'affaires société constant ne change pas ce score.
- Le superviseur et le contrôleur de gestion ne voient pas les rémunérations individuelles.
- La facture que le freelance remet à son détaillant (PDF compris) porte son prix seul, jamais le prix société.

### 4.3 Le jeu de démonstration

**Ce que ça veut dire.** Un prospect doit pouvoir jouer UJ-1 et UJ-2 avec des données qui ressemblent à son métier. Le jeu est **fictif** et ne reprend aucun client réel. Il remplace les registres de la démo, dont les chiffres ne concordent pas (lignes différentes du montant de la facture, TVA calculée à 15 % du TTC, trois formats de numéro de facture, année 2026 figée).

#### FR-9 : Le Grossiste du Golfe

Prospera fournit un jeu de démonstration, **« Grossiste du Golfe »**, grossiste fictif de jus et boissons à Lomé.

**Conséquences (testables) :**
- Deux points de stock : un entrepôt à Lomé Port et un dépôt à Kara.
- Trois zones : Lomé Centre, Golfe Nord, Plateaux, de vraies communes du Togo.
- Douze agents de terrain, dont trois freelances et un chargé de prospection ; un compte par rôle du §2.1.
- Environ 600 points de vente, avec position GPS dans leur zone, plafond de crédit et conditions de règlement.
- Un catalogue de jus et boissons en bouteille, pack et carton, avec dates limites et lots pour les produits périssables : 60 à 80 articles en 5 familles (jus, nectars, sodas, eaux, boissons énergisantes). La taille du catalogue est un paramètre du jeu, modifiable ; la gamme exacte reste à confirmer par le PO.
- Chaque article porte son poids, son volume et son nombre d'unités par palette.
- Des camions (porteur, fourgon, tricycle, chacun avec charge utile et volume utile) et des préparateurs de commandes (cadence, heures disponibles), comme données de l'organisation.
- Les capacités des entrepôts et les heures de départ des camions : Lomé Port 3 200 m², 1 450 emplacements, 4 quais, départ à 15:30 ; Kara 900 m², 380 emplacements, 1 quai, départ à 14:00.
- Chaque agent de terrain a un plan de journée pour aujourd'hui et pour les dix jours ouvrés suivants ; Kodjo, commercial à Bè, a 14 visites aujourd'hui (UJ-2).
- Trois mois d'historique : commandes, factures, encaissements (PI-SPI, FedaPay, espèces), relances, visites, réceptions fournisseurs.
- De vrais impayés : la balance âgée a des créances dans chaque tranche.

#### FR-10 : Trois tailles

Le jeu existe en trois tailles : **petit** (1 entrepôt, 4 agents, 120 points de vente), **moyen** (le §FR-9, par défaut), **grand** (4 points de stock, 40 agents, 2 000 points de vente). Les trois sont générés par la même règle.

**Conséquences (testables) :**
- Chaque taille se charge dans une organisation vierge en moins de 10 minutes (objectif de test par défaut, modifiable).
- Le grand jeu sert aux mesures de performance du §8.

#### FR-11 : Un jeu cohérent au centime

Les chiffres du jeu se vérifient entre eux.

**Conséquences (testables) :**
- Pour chaque facture : total HT par taux, TVA = taux × total HT arrondi une seule fois par taux (NFR-2), HT + TVA = TTC, au franc près. Le jeu contient des factures à plusieurs lignes où ce calcul diffère d'un arrondi ligne par ligne.
- Les encaissements sans facture (acomptes) sont des crédits de tiers, et ils figurent dans l'encours du tiers.
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
- Le prospect joue UJ-1 et UJ-2 de bout en bout : voir FR-20 à FR-24.

### 4.4 Les garde-fous

#### FR-13 : Des garde-fous paramétrables qui bloquent

Les seuils de la démo deviennent des **paramètres de l'organisation**, avec les valeurs de la démo par défaut. Un garde-fou **bloque** l'action ; il ne se contente pas de l'afficher (une seule exception, la marge minimale du freelance, avertit).

| Garde-fou | Valeur par défaut (démo) | Ce qu'il bloque | Qui peut passer outre |
|---|---|---|---|
| Plafond de crédit d'un point de vente | par point de vente, jugé sur l'encours | la validation d'une commande si l'encours dépasse le plafond | DAF (dérogation tracée) |
| Rappel de retard | J+1 | rien : un rappel part | : |
| Alerte à la direction | J+30 | rien : la direction est alertée | : |
| Blocage du crédit | créance échue depuis plus de 60 jours, ou encours au-dessus du plafond | toute nouvelle commande du tiers (blocage automatique, règle auditée, exception explicite à FR-158) | DAF seul ; le déblocage n'est jamais automatique |
| Marge minimale du freelance | 12 % | rien : l'envoi n'est pas bloqué, un avertissement s'affiche | : |
| Plafond de crédit à la 1re commande | 1,5 M | la 1re commande d'une ouverture | DC |
| Plancher de trésorerie | 40 M | une commande fournisseur ou un paiement qui le franchit | DAF, puis DG |
| Plafonds de validation d'un achat | 5 M (resp. stock), 20 M (DAF), DG au-delà | la validation d'une commande fournisseur | le niveau suivant |
| Seuil de remise soumise au DG | 12 % | une remise ou un combo au-delà | DG |
| Géofencing de clôture de visite | 200 m | rien : la clôture hors rayon reste possible, avec un **motif obligatoire**, et elle est signalée au superviseur | : |
| Distance maximale rentable d'une ouverture | 35 km | la création d'un prospect au-delà | DC |

**Conséquences (testables) :**
- Une action bloquée rend un refus nommé et lisible, avec le seuil et le moyen de le lever.
- Chaque dérogation est enregistrée : qui, quand, combien, pourquoi.
- Changer un seuil est réservé à `DIST_ADMIN` et au DG, et tracé.
- Les seuils de retard forment une seule table paramétrable (rappel, alerte, blocage) : aucun autre seuil de retard n'existe dans un module. Les cinq tranches de la balance âgée restent paramétrables.

### 4.5 Alertes et décisions

#### FR-14 : Un modèle unique d'alerte et de décision

Toutes les alertes et toutes les décisions à trancher des écrans (DG, DAF, recouvrement, marketing, stock, automatisations) suivent un seul modèle : objet concerné, rôle destinataire, gravité, échéance, statut, et pour une décision, les choix possibles.

**Conséquences (testables) :**
- Une décision passe de `À_TRANCHER` à `VALIDÉE`, `REFUSÉE` ou `REPORTÉE` (avec nouvelle échéance), enregistrée avec son auteur.
- Un journal des décisions, consultable par la direction, dit qui a décidé quoi et quand, et si c'est réversible.
- Le badge « à valider » du menu compte les décisions réellement en attente.
- Chaque module possède ses décisions, sur ce même schéma ; `dashboard` les liste, il ne les possède pas.

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
- Un module qui en exige un autre le déclare et s'installe avec lui (par exemple `facturation` exige `paiement`).
- `commande` exige `pdv` : une commande porte toujours un point de vente. La vente au comptoir passe par un « client comptoir » générique, un par point de stock (décision du PO du 2026-11-12, Q11).
- Un pack est une liste de modules que l'organisation active d'un coup ; la liste est une donnée, pas du code.

### 4.9 L'essai du prospect

**Ce que ça veut dire.** Le prospect joue UJ-2 sans commercial à ses côtés. Il lui faut l'application, des comptes, une position, et des messages qui partent.

#### FR-20 : L'application terrain est livrée au prospect

L'application terrain `prospera-terrain` (Flutter, décision du PO) fonctionne hors connexion et se distribue au prospect pour son essai, sur son téléphone, sans passer par une boutique d'applications d'entreprise. Réalise UJ-2 et UJ-8.

**Conséquences (testables) :**
- Le prospect reçoit un lien et installe l'application seul, sur un Android d'entrée de gamme.
- Elle fonctionne sans réseau pendant une journée de tournée (NFR-6).

#### FR-21 : Se connecter par rôle dans l'essai

Dans l'essai, le prospect passe d'un compte du jeu à un autre en un geste (« Se connecter en tant que… » Akossiwa, Kodjo, Mensah, Yawa, Ayité), sans mot de passe à saisir ni à connaître. Réalise UJ-8.

**Conséquences (testables) :**
- Chaque compte ne voit que son périmètre (FR-6) : le prospect constate lui-même la différence entre les rôles.
- Cette connexion n'existe que dans les essais, jamais dans une organisation en production.

#### FR-22 : Des positions qui permettent de clôturer une visite

Les positions GPS des points de vente du jeu sont calées près d'un lieu de démonstration, ou l'essai propose un **mode « démonstration »** qui simule la position de l'agent. Ce mode se voit à l'écran : une visite clôturée en mode démonstration le dit. Réalise UJ-2.

**Conséquences (testables) :**
- Un prospect qui n'est pas à Lomé clôture ses 14 visites sans qu'aucune ne soit signalée hors rayon à tort.
- Une visite clôturée en mode démonstration ne se mélange pas aux positions réelles.

#### FR-23 : Les envois de l'essai sont visibles

La facture et le rappel partent par WhatsApp (module `notification`). Dans l'essai, chaque message envoyé est lisible dans un journal d'envoi visible du prospect ; les messages ne partent que vers un numéro que le prospect a déclaré. Réalise UJ-1.

**Conséquences (testables) :**
- Après « Envoyer par WhatsApp », le prospect voit le message, son destinataire et son état.
- Un envoi vers un numéro non déclaré est retenu et signalé.

#### FR-24 : Les paiements de l'essai sont des paiements de test

Dans l'essai, un paiement par FedaPay ou par PI-SPI passe par le mode de test du moyen de paiement : il suit le même chemin qu'un vrai paiement (lien, confirmation, encaissement, facture partiellement payée), mais aucun argent ne bouge. Réalise UJ-1 et UJ-8.

**Conséquences (testables) :**
- Le prospect paie la moitié de la facture de Mme Adjo depuis le lien reçu ; la facture passe « partiellement payée » et la balance âgée le montre.
- Chaque encaissement de l'essai porte la mention « test », à l'écran et dans le PDF.
- Un essai ne peut jamais encaisser un paiement réel ; une organisation en production ne peut jamais encaisser un paiement de test.

### 4.10 Les données personnelles

#### FR-25 : Positions des agents et messages des clients

Deux données personnelles suivent une règle fixée par le PO (décisions du 2026-11-12, Q7 et Q12). **Positions GPS des agents de terrain** : l'agent en est informé à l'embauche ; elles se conservent 90 jours glissants, puis sont purgées. **Messages WhatsApp des clients** : leur conservation et le recueil du consentement suivent le PRD notification (§9.2). Réalise UJ-2 et UJ-3.

**Conséquences (testables) :**
- Une position de plus de 90 jours n'est plus lisible, ni à l'écran ni par l'API ; les indicateurs déjà calculés restent.
- L'information donnée à l'agent sur sa position est enregistrée sur sa fiche, avec sa date.
- Un message de client se conserve et s'efface selon les durées du PRD notification, paramétrables par organisation sous son plafond ; sa preuve de consentement est consultable.
- Les positions simulées du mode démonstration (FR-22) ne sont jamais mélangées aux positions réelles.

`FR-26` à `FR-29` : libres.

---


<!-- COUPURE-TRONC : ne pas supprimer ; ici s’insèrent les parties 2 à 4 -->

## 8. Exigences transverses

- **NFR-1, rien ne se perd.** Une action confirmée à l'écran est enregistrée. Les factures, les avoirs, les bons numérotés (et leurs compteurs) et les encaissements confirmés ne se perdent **jamais** : aucune perte n'est admise pour eux, même en cas de panne de la plateforme. La perte maximale d'une heure de données, comme le reste de Prospera, ne vaut que pour les autres données. Après une restauration, aucun numéro déjà émis n'est réémis, et aucun encaissement confirmé par PI-SPI ou FedaPay ne manque.
- **NFR-2, l'argent est exact.** Les montants sont en unités entières de la devise (XOF sans décimale). La TVA se calcule **par taux, sur le total HT de la facture**, avec un seul arrondi par taux, selon une règle d'arrondi unique et écrite ; la même règle sert la facture, l'avoir et la proforma (FR-45, FR-11). Aucun taux n'est codé en dur : il vient du paquet fiscal du pays (18 % au Togo).
- **NFR-3, la numérotation ne ment pas.** Les factures suivent une seule série par organisation, continue d'année en année, qui reprend le dernier numéro de Sage ; les avoirs et les bons de livraison ont chacun leur propre suite continue. Aucune suite n'a de trou ni de doublon, même sous des saisies simultanées. Un bon annulé garde son numéro.
- **NFR-4, sécurité.** Authentification réelle par le socle (aucun mot de passe dans le code) ; périmètres appliqués par le serveur (FR-5, FR-6) ; aucun secret dans les écrans ; un téléphone perdu peut être déconnecté à distance.
- **NFR-5, traçabilité.** Toute action sur l'argent, le stock, un garde-fou ou une décision est journalisée : qui, quoi, quand, avant, après. Le journal ne se modifie pas.
- **NFR-6, hors connexion.** L'application terrain fonctionne sans réseau pendant une journée de tournée ; au retour du réseau, rien n'est perdu et rien ne compte deux fois.
- **NFR-7, performance.** Sur le grand jeu (FR-10) : une liste de 2 000 points de vente s'affiche en moins de 2 s ; une facture se crée en moins de 1 s ; l'application terrain démarre en moins de 5 s sur un Android à 2 Go. Ce sont des cibles par défaut, modifiables quand la taille du client de février sera connue.
- **NFR-8, langue.** Tout le produit est en français ; les montants s'écrivent « 35 000 F » ; les dates au format jj/mm/aaaa.
- **NFR-9, hébergement.** Le client de février est hébergé chez Money Vibes ; chaque module suit la règle des 7 jours de retour arrière (contrat, C12).
- **NFR-10, conservation.** Les factures et les avoirs se conservent 10 ans par défaut (liste de travail jusqu'à la validation de l'expert-comptable du client, décision du PO, Q6). La fermeture d'une organisation n'efface jamais une pièce que la loi oblige à conserver. Les positions GPS des agents se purgent après 90 jours glissants (FR-25).

---

## 9. Indicateurs de réussite

**Principaux**
- **SM-1, les deux moments.** Un prospect joue UJ-1 et UJ-2 de bout en bout, seul, sur le vrai serveur, dans son essai. Cible : 100 % des essais du 15/01 ; aucun blocage. Mesure : un parcours scripté, rejoué sur chaque essai, avec le journal de ses étapes. Valide FR-1, FR-9, FR-20 à FR-24, et les modules ★ des parties 2 à 4 (dont `terrain`).
- **SM-2, zéro bouton qui ment.** 100 % des boutons d'action sont `BRANCHÉ` ou `BIENTÔT` ; 0 bouton simulé. Valide FR-2.
- **SM-3, la facture juste.** Sur le grand jeu, puis sur le jeu de reprise du client de février : 0 trou et 0 doublon de numéro ; 100 % des factures avec, pour chaque taux, TVA = taux du paquet fiscal × total HT, arrondi une fois, au franc près. Valide FR-11, NFR-2, NFR-3.
- **SM-4, la tournée finie.** Une visite clôturée hors connexion apparaît chez le superviseur moins d'une minute après le retour du réseau, sans doublon d'encaissement. Valide NFR-6 et la partie 3.

**Secondaires**
- **SM-5, chiffres vrais.** 0 indicateur constant (vérifié par un test qui modifie une donnée et attend que l'indicateur bouge). Valide FR-15.
- **SM-6, périmètres étanches.** 0 donnée hors périmètre rendue, sur une suite qui essaie chaque rôle contre chaque écran et chaque route. Valide FR-5, FR-6, FR-8.
- **SM-7, le client de février prêt.** La liste de ses besoins du premier jour (§10.1) est jouée sur son jeu de reprise avant la mise en service. Valide les modules ★.
- **SM-8, la caisse du soir.** Chez le client de février, après 30 jours d'usage : 0 écart de caisse non expliqué le lendemain de la tournée, pour chaque commercial. Base : à relever chez le client à la bascule. Cible par défaut, modifiable.
- **SM-9, la facture du jour.** Chez le client de février : 90 % des livraisons confirmées sont facturées le jour même. Cible par défaut, modifiable.

**Contre-indicateurs (à ne pas optimiser)**
- **SM-C1, nombre d'écrans branchés.** Brancher vingt écrans à moitié vaut moins que deux parcours de bout en bout. Contrebalance SM-2.
- **SM-C2, quantité d'« IA » affichée.** Afficher plus de scores sans provenance ni justesse dégrade la confiance. Contrebalance FR-16.

---

## 10. Périmètre

### 10.1 Dans le périmètre

Tout ce que la démo présente (20 modules, en 4 familles), en vrai, selon les parties 2, 3 et 4. Aucun ordre ni aucune date ne sont figés (décision du PO du 2026-11-12) : on avance selon l'évolution, en commençant naturellement par ce qui sert les deux parcours n° 1 et le client de février (modules ★ : `commande`, `facturation`, `paiement`, `recouvrement`, `pdv`, `catalogue`, `stock`, `terrain`). Ce qui n'est pas livré est « bientôt », sans date, jamais simulé. Le risque de ce choix est assumé au §12.

**Les besoins du premier jour du client de février** (texte du PO), joués par SM-7 :
- **Reprise depuis Sage** : clients avec leurs conditions de règlement et leurs plafonds ; articles et tarifs, dont les prix propres à chaque client ; factures impayées ; suite de la numérotation.
- **Commande** : saisie avec le stock vérifié, validation, bon de livraison, puis facture en un clic.
- **Facturation** : mentions légales, TVA à 18 %, numérotation continue, PDF, avoirs, paiements partiels, balance clients et balance âgée.
- **Encaissements, relances et recouvrement**, **points de vente**, **catalogue** et **stock**, qui portent les besoins ci-dessus.

### 10.2 Hors périmètre pour l'instant

- **Comptabilité en février** : elle n'est pas considérée pour février (décision du PO du 2026-11-12, Q2). Les exigences de `finance-transactions` (§6.4) restent dans le PRD, mais aucune comptabilité de référence n'est exigée en février ; elles viennent après.
- **Export vers Sage** (factures et paiements importables par Sage) : après, décision du PO.
- **Facture normalisée et certification OTR** : non exigées pour février ; les e-factures sont « bientôt ».
- **Télédéclaration OTR** : module `declarations`.
- **Connecteur Odoo** : module `connecteurs`, hors février.
- **Compte-rendu vocal, assistant conversationnel** : « bientôt ».
- **Consignes de bouteilles et de casiers** : hors v1 (décision du PO du 2026-11-12, Q5). Un casier rendu n'est ni un avoir ni un paiement.
- **Un second pays** : le produit est écrit pour le Togo (XOF, TVA du paquet fiscal togolais) ; le reste de l'UEMOA vient après le premier client. Les taux viennent toujours du paquet fiscal du pays (NFR-2), ce qui ne ferme pas cette porte.
- **Prix, paliers d'abonnement, maintenance, offre pilote** : ils relèvent de l'offre commerciale, pas de ce PRD.
- **Fonctions « IA » de l'offre** : en février, une fonction promise est soit une **règle** avec sa provenance (FR-16 : score d'un point de vente, probabilité de recouvrement, probabilité d'acceptation d'une proforma, prévisions, coaching, réappro), soit « bientôt » (détection de départ d'un client, de fraude sur les espèces, optimisation des tournées, alerte de proximité, comparaison avec d'autres distributeurs, recommandation de prix au freelance, assistant). Aucune précision annoncée n'est promise par ce PRD.

---

## 11. Non-objectifs

- Prospera Distributeur **n'est pas un logiciel de comptabilité générale** : à terme, il produit les écritures depuis ses factures et ses encaissements ; il ne remplace pas un cabinet. En février, aucune comptabilité de référence n'est exigée de lui (§10.2).
- Prospera **ne détient jamais les fonds** : le distributeur encaisse sur son compte, chez son fournisseur de paiement.
- Les points de vente **n'ont pas de compte** en v1.
- Aucune règle n'est écrite pour un client nommé : tout ce qui varie d'un distributeur à l'autre est un paramètre (contrat, C6).

---

## 12. Décisions, actions restantes et risques assumés

Toutes les questions posées au PO (Q1 à Q12) sont tranchées. Il ne reste que des actions à mener et des risques assumés.

### 12.1 Décisions prises

| N° | Décision | Source |
|---|---|---|
| D-1 | **La Créance est portée par `paiement`** : un registre unique, ouvert par sa source (facture, échéance de prêt, prime), soldé par les encaissements, lu par `recouvrement`. L'argent reçu sans créance est un crédit du tiers, tenu par `paiement`. Le PRD paiement est à amender (tiers, source, périmètre, composantes). | PO, 2026-11-12 |
| D-2 | **La facture naît à la livraison**, sur les quantités livrées. Le camion sort de l'usine ou de l'entrepôt sur le bon de livraison émis à la validation (le terrain l'appelle « bon de commande »). | PO, 2026-11-12 |
| D-3 | **Numérotation** : une seule série de factures par organisation, continue d'année en année, qui reprend le dernier numéro de Sage. | PO, 2026-11-12 |
| D-4 | **Freelance (Q1) : il vend pour le compte de la société.** Le stock reste à la société jusqu'à la livraison au détaillant ; le freelance n'achète pas de stock. Il facture son détaillant au prix qu'il négocie ; il doit le prix société à la société, même si son détaillant ne paie pas ; la société lui verse une commission calculée sur le prix société ; sa marge de négociation est à lui, invisible de la société (UJ-9). | PO, 2026-11-12 |
| D-5 | **Seuils de retard** : rappel à J+1, alerte à la direction à J+30, blocage automatique du crédit au-delà de 60 jours de créance échue ou d'un encours au-dessus du plafond ; jamais de déblocage automatique, seul le DAF le lève (FR-13). | PO, 2026-11-12 |
| D-6 | **Tous les écrans** des modules déjà cadrés (`reseau`, `pdv`, `catalogue`, `stock`) sont voulus ; on ajustera selon l'évolution. | PO, 2026-11-12 |
| D-7 | **Pas de date** sur les boutons « bientôt », et aucun ordre de livraison figé (« on va voir en évoluant »). | PO, 2026-11-12 |
| D-8 | **Sage** : le client de février quitte Sage. Le document tarifaire qui le classe « Odoo complet » est à corriger ; ce n'est plus une question. L'export vers Sage vient après. | PO, 2026-11-12 |
| D-9 | **Comptabilité (Q2)** : elle n'est pas considérée pour février. Les exigences de `finance-transactions` restent dans le PRD, hors du périmètre de février (§10.2). | PO, 2026-11-12 |
| D-10 | **Réservation (Q3)** : le stock se réserve à la validation ; l'allocation du matin par priorité ne porte que sur les commandes en attente de stock. | PO, 2026-11-12 |
| D-11 | **Prix propres à chaque client (Q4)** : une grille « ce client » dans `catalogue` (amendement du PRD catalogue). | PO, 2026-11-12 |
| D-12 | **Consignes (Q5)** : les consignes de bouteilles et de casiers sont hors v1. | PO, 2026-11-12 |
| D-13 | **Mentions légales (Q6)** : la liste des mentions de la facture et la durée de conservation sont une liste de travail jusqu'à leur validation par l'expert-comptable du client (action A-1). | PO, 2026-11-12 |
| D-14 | **Position GPS des agents (Q7)** : information à l'embauche, conservation 90 jours glissants puis purge (FR-25) ; avis juridique à obtenir (action A-2). | PO, 2026-11-12 |
| D-15 | **Commission (Q8)** : sur l'encaissé pour les salariés ; sur le prix société facturé pour le freelance. | PO, 2026-11-12 |
| D-16 | **Score de santé d'un point de vente (Q9)** : au premier jour, c'est une règle de `dashboard`, déposée dans `pdv` avec sa provenance (FR-16). | PO, 2026-11-12 |
| D-17 | **Paiement des fournisseurs (Q10)** : les ordres de paiement sont exigés ; la transmission réelle part dès que le raccordement de l'organisation est fait. | PO, 2026-11-12 |
| D-18 | **Point de vente obligatoire (Q11)** : une commande exige un point de vente ; un « client comptoir » générique par point de stock couvre la vente au comptoir (FR-19). | PO, 2026-11-12 |
| D-19 | **Messages WhatsApp (Q12)** : conservation et consentement alignés sur le PRD notification §9.2 (FR-25). | PO, 2026-11-12 |
| D-20 | **Cadrage** : un seul PRD ; le front de démo définit ce qu'on veut ; les deux moments (facture juste, tournée finie) comptent à égalité ; moyens de paiement PI-SPI et FedaPay ; application terrain en Flutter ; jeu de démonstration fictif ; boutons non branchés « bientôt », jamais simulés. | PO, `.memlog.md` |

Par défaut, et modifiable, la balance âgée garde cinq tranches paramétrables, et un dossier de recouvrement est ouvert par tiers.

### 12.2 Actions qui restent au PO

| N° | Action | Ce qu'elle débloque | Qui | Échéance |
|---|---|---|---|---|
| A-1 | Faire valider par l'expert-comptable du client la liste des mentions légales de la facture (NIF, RCCM, régime, pénalités de retard), la durée de conservation et la suite continue sur plusieurs années. | La recette de la facture (FR-44, FR-46, NFR-10) | PO, avec l'expert-comptable du client | avant les stories de `facturation`, au plus tard avant la recette de la facture |
| A-2 | Obtenir un avis juridique sur la position GPS des agents (information à l'embauche, conservation 90 jours). | La mise en service de `terrain` chez le client (FR-25) | PO | avant février |
| A-3 | Obtenir la taille du client de février : commerciaux, points de vente, factures par mois, entrepôts. | Les cibles de performance (NFR-7) et la taille du jeu (FR-10) | PO, au prochain rendez-vous | avant la spine |
| A-4 | Obtenir les éléments pas encore reçus : notes de rendez-vous, exports Sage (clients, articles, factures ouvertes, modèle de facture, dernier numéro), messages WhatsApp. | Le format du numéro de facture, la reprise | PO | avant les stories |
| A-5 | Confirmer la gamme exacte du jeu de démonstration (FR-9), sans recherche externe sur le client. | Le jeu « Grossiste du Golfe » | PO | avant les stories |
| A-6 | Mettre l'offre en cohérence : document tarifaire « Odoo complet » ; 10 ou 18 modules au même prix ; somme des bundles au-dessus de la plateforme complète ; contrôle de gestion dans aucun bundle. Le PRD n'en dépend pas. | L'offre commerciale | PO | avant février |

**Prérequis des modules ★.** Quatre amendements d'autres PRD doivent être écrits avant les stories des modules ★ : `paiement` (Créance et crédit du tiers, D-1), `catalogue` (grille « ce client », D-11), `pdv` (conditions de règlement et blocage du crédit), `stock` (réservation à la validation, D-10). Ils sont décrits dans la partie 4 et validés par le PO.

### 12.3 Risques assumés

| N° | Risque | Conséquence acceptée |
|---|---|---|
| R-1 | **Tout, sans ordre ni date.** Le périmètre est tout ce que la démo présente, sans ordre de livraison ni date (décision du PO, D-6 et D-7), face à deux échéances fermes : les essais du 15/01 et le client de février. La charge n'est pas chiffrée. | La planification se fait au découpage en épics. La règle « bientôt » donne la marge : ce qui n'est pas prêt s'affiche « bientôt » sans casser SM-1 ni SM-7, tant que les modules ★ et FR-20 à FR-24 sont livrés. |
| R-2 | **Pas de comptabilité en février** (D-9). | Entre la bascule et l'arrivée de la comptabilité, les ventes et les encaissements sont dans Prospera et plus dans Sage. L'expert-comptable du client travaille sur les listes exportées (FR-18) ; l'export vers Sage vient après. |
| R-3 | **Mentions légales en liste de travail** (D-13). | Tant que l'expert-comptable du client n'a pas validé la liste (A-1), la recette de la facture attend. |
| R-4 | **Freelance qui vend pour le compte de la société** (D-4). | La société porte le risque de crédit sur le freelance, pas sur son détaillant : la dette du freelance ne change pas si son détaillant ne paie pas. |

---

