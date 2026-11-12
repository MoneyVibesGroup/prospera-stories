## 7. Partie 4 — Les modules déjà cadrés : fiches de renvoi

Huit modules dont le distributeur a besoin ont déjà leur PRD, leur spine et leur manifeste : `reseau`, `pdv`, `catalogue`, `stock`, `paiement`, `notification`, `reprise`, `connecteurs`. **Ce PRD n'en réécrit rien.** Chaque fiche ci-dessous dit trois choses : ce que la démo montre et que le PRD du module couvre déjà (renvoi par identifiant, pas de recopie) ; ce que la démo exige en plus ou autrement (les écarts, chacun devenu une exigence numérotée FR-180 à FR-219, avec sa conséquence testable) ; ce que le PRD du module exige et que la démo ne montre pas (les écrans à créer, que la démo ne définit pas).

Règles de lecture, valables pour tout le chapitre.

- La démo (`prospera-font-end/prospera-distributeur`) définit le produit. Sa seule exception est une décision postérieure et explicite du PO (carte Google Maps, PI-SPI **et** FedaPay).
- Une exigence ci-dessous est un **écart à porter au PRD du module** : le propriétaire du PRD du module l'amende (ou la refuse) avant la validation du lot ; tant qu'il ne l'a pas fait, l'exigence tient ici et ne se code pas à la place du module.
- La démo n'a ni serveur ni base : tout écran « absent de la démo » est à concevoir, jamais à deviner. Les boutons non branchés sont **« bientôt »**, pas des fonctions.
- Le client de février est un grossiste qui quitte Sage ; il n'est pas nommé ici. Le jeu de test est le grossiste fictif « Grossiste du Golfe » (jus et boissons), défini en partie 1.
- Les identifiants de la forme `FR-Cnn`, `FR-Vnn`, `FR-Snn`, `FR-Pnn`, `FR-Nnn`, `FR-Rnn` renvoient au PRD du module nommé dans la fiche ; `FR-1`…`FR-22` à la fiche Reprise ou Connecteurs. Les identifiants `FR-180` à `FR-219` sont ceux de ce PRD.

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

**Ce que la démo montre et que le PRD couvre.** Le périmètre du distributeur (FR-9) : points de vente, produits et prix société et freelance, créances ouvertes, commerciaux, fournisseurs, stock d'ouverture ; historique des ventes et des paiements. Export Sage en fichier (FR-1, gabarit Sage ; février = fichiers seulement). Libre-service prêt en février, y compris pour un prospect en essai (FR-19). Comptage d'ouverture (FR-10). Le manifeste `reprise` : `depends: []`, `enrichiPar: [pdv, catalogue, reseau, stock, facturation, assurance, sinistres]`, six droits `reprise:*`.

**Écarts à porter au PRD du module.**

#### FR-215 : L'écran d'import en libre-service est entièrement à créer
La démo n'a aucun téléversement, aucune correspondance de colonnes, aucun rapport avant import ; seul `RapportExportBar.tsx:4` exporte en CSV et PDF. FR-19 exige un libre-service prêt en février. Écran à créer, accessible au détenteur de `reprise:lot:importer` : dépôt de fichiers (modèles Sage téléchargeables), correspondance de colonnes, **simulation** (rapport sans écriture, par le module cible), correction des lignes rejetées, doublons à fusionner (FR-12), valeurs de contrôle (écart nul, FR-15), feu vert par module cible puis application. Le comptage d'ouverture du stock a son écran propre (FR-10).
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

**Ce que le PRD exige et que la démo ne montre pas.** Tout le reste est à créer : provenance de chaque donnée (FR-2) ; fichiers (FR-3) ; états valides (FR-5) ; dates d'origine (FR-6) ; montants à saisir (FR-7) ; doublons (FR-12) ; droit de valider attribué par le DG seul (FR-13) ; livraison (FR-14) ; écart nul et feu vert par module (FR-15) ; marche en parallèle (FR-17) ; FR-21 et FR-22. L'historique des ventes (partie « historique protégé » de FR-9) n'a pas de cible : voir la question ouverte OQ-4-5.

---

### 7.8 Connecteurs (`connecteurs`, M43) — PRD `prd-connecteurs-2026-11-10`

**Ce que la démo montre et que le PRD couvre.** Rien à l'écran. La démo ne montre aucune frontière entre ce que Prospera possède et ce que le logiciel du client possède ; seul le texte « Intégration Odoo » existe (`prospera_pricing_distribution.md:27`), sans écran. Le PRD Connecteurs (FR-14 : distributeur et Odoo) fixe un propriétaire par domaine : points de vente, visites, commandes terrain = Prospera ; encaissements terrain (Mobile Money, espèces) = Prospera ; produits et prix, stock, créances ouvertes, fournisseurs = Odoo si le client le garde ; commerciaux = Prospera. Le manifeste `connecteurs` : `depends: []`, `enrichiPar: [reprise, pdv, catalogue, stock, facturation, pi-spi, approvisionnement]`, quatre droits `connecteurs:*`, `domainesEchange: []`.

**Écarts à porter au PRD du module.**

#### FR-218 : Connecteurs est hors février ; l'export vers Sage vient après
Amendement du 2026-11-12 (spine de Connecteurs, AD-32) : Connecteurs est hors février. Décision du PO, même jour : l'export vers Sage se fera **après** février ; pour février, le projet est démontrable avec de vraies données de test et des parcours concrets. Conséquences pour ce PRD : aucun bouton de la démo ne promet une intégration ; « Intégration Odoo », « Export Sage » et « Télédéclarer sur le portail OTR » affichent `bientôt` ; les modules de la partie 2 déclarent leurs `domainesEchange` dès le manifeste (facturation, encaissements) pour que le passage futur ne les oblige pas à une reprise de code (règle du point d'écriture unique par domaine, contrat §6). Le manifeste `connecteurs` cite `pi-spi` dans `enrichiPar` : le module s'appelle `paiement` (FR-205), et la ligne est à corriger.
**Conséquences (testables) :** (1) aucun écran du distributeur ne déclenche un échange avec un logiciel externe en février ; (2) la section « Intégrations » du menu n'apparaît que si `connecteurs` est installé ; (3) un domaine d'échange déclaré (par exemple `facturation.factures`) a une seule fonction d'écriture de service, vérifiée par la suite de conformité ; (4) `connecteurs.enrichiPar` ne contient plus `pi-spi`.

#### FR-219 : Contradiction de source : le logiciel quitté est-il Sage ou Odoo ?
Le brain dump du PO et le PRD Reprise disent que le client de février **quitte Sage**. La documentation commerciale classe le même client « Odoo complet » (`prospera_pricing_distribution.md:16`) et dit que les distributeurs togolais ont déjà un CRM ou un ERP, souvent Odoo (`:6`). Hypothèse de travail de ce PRD : **Sage**, donc aucun connecteur Odoo en février (déjà acté par AD-32) et une reprise par fichiers au gabarit Sage (FR-1). Si c'était Odoo, la ligne FR-14 de Connecteurs repasserait en jeu et le périmètre de février changerait (étapes 1 à 3 de FR-17). La question est ouverte (OQ-4-1) et doit être tranchée avant la validation du lot.
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
