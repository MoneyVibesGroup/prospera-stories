## 7. Partie 4 — Les modules déjà cadrés : fiches de renvoi

Huit modules dont le distributeur a besoin ont déjà leur PRD, leur spine et leur manifeste : `reseau`, `pdv`, `catalogue`, `stock`, `paiement`, `notification`, `reprise`, `connecteurs`. **Ce PRD n'en réécrit rien.** Chaque fiche ci-dessous dit trois choses : ce que la démo montre et que le PRD du module couvre déjà (renvoi par identifiant, pas de recopie) ; ce que la démo exige en plus ou autrement (les écarts, chacun devenu une exigence numérotée, FR-180 à FR-219 puis FR-240 à FR-259, avec sa conséquence testable) ; ce que le PRD du module exige et que la démo ne montre pas (les écrans à créer, que la démo ne définit pas).

Quatre de ces modules sont ★ (besoins du premier jour du client de février) : `pdv`, `catalogue`, `stock` et `paiement` (encaissements). Leur fiche porte ★.

Règles de lecture, valables pour tout le chapitre.

- La démo (`prospera-font-end/prospera-distributeur`) définit le produit. Sa seule exception est une décision postérieure et explicite du PO (carte Google Maps, PI-SPI **et** FedaPay, Créance tenue par `paiement`).
- Une exigence ci-dessous est un **écart à porter au PRD du module**. **Porteur** : le propriétaire du PRD du module nommé dans la fiche, qui l'amende (ou la refuse) avant la validation du lot. **Statut** : proposé, jusqu'à cet amendement. Tant qu'il n'est pas écrit, l'exigence tient ici et ne se code pas à la place du module.
- Ces exigences ne s'ajoutent pas à la charge de ce PRD : elles se codent dans le module qui les porte.
- La démo n'a ni serveur ni base : tout écran « absent de la démo » est à concevoir, jamais à deviner. Les boutons non branchés sont **« bientôt »**, sans date, pas des fonctions.
- Le client de février est un grossiste qui quitte Sage ; il n'est pas nommé ici. Le jeu de test est le grossiste fictif « Grossiste du Golfe » (jus et boissons), défini en partie 1.
- Les identifiants de la forme `FR-Cnn`, `FR-Vnn`, `FR-Snn`, `FR-Pnn`, `FR-Nnn`, `FR-Rnn` renvoient au PRD du module nommé dans la fiche ; `Reprise FR-n` et `Connecteurs FR-n` au PRD Reprise ou Connecteurs. Les identifiants `FR-180` à `FR-219` et `FR-240` à `FR-259` sont ceux de ce PRD.

| Module | Code | Réf. M | PRD | Manifeste |
|---|---|---|---|---|
| Réseau, agences & zones | `reseau` | M01 | `prd-reseau-zones-2026-08-02` | `manifestes/reseau.manifest.ts` |
| ★ CRM points de vente & pipeline | `pdv` | M02 | `prd-pdv-2026-08-02` | `manifestes/pdv.manifest.ts` |
| ★ Catalogue, produits & tarification | `catalogue` | M04 | `prd-catalogue-produits-2026-08-02` | `manifestes/catalogue.manifest.ts` |
| ★ Stock & logistique | `stock` | M06 | `prd-stock-2026-08-02` | `manifestes/stock.manifest.ts` |
| ★ Encaissements & moyens de paiement | `paiement` | M33 | `prd-paiement-service-2026-08-02` (+ amendement 2026-09-21) | `manifestes/paiement.manifest.ts` |
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

**Ce que le PRD exige et que la démo ne montre pas.** Tous ces écrans sont à créer, car aucun n'existe dans la démo : redécoupage versionné (FR-R05, FR-R05b) ; agences, horaires, paramètres (FR-R06 à FR-R10) ; déplacement d'un nœud avec compte rendu (FR-R14) ; rattachement des lieux aux zones, desserte principale et de secours (FR-R16 à FR-R18) ; affectations datées et nœud sans responsable (FR-R20 à FR-R22) ; attribution d'une portée, droit le plus sensible (FR-R36) ; import (FR-R37) ; audit (FR-R40). **Tous ces écrans sont voulus** (décision du PO du 2026-11-12 : « pour le moment je veux les voir tous ; en fonction de l'évolution on va voir »).

---

### 7.2 ★ Points de vente (`pdv`, M02) — PRD `prd-pdv-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Identité, zone et nature `PROPRE` / `PARTENAIRE` (FR-V01 ; `PointsDeVenteView.tsx:169`) ; commercial affecté (FR-V08) ; pipeline (FR-V15) ; vue unique avec commandes, livraisons, créances et ancienneté, visites (FR-V22 ; `PdvRapportView.tsx:134-332`) ; segments actifs / dormants / VIP (FR-V26) ; carte de couverture (FR-V27) ; champs de score (FR-V34) ; candidats pour l'assistant (FR-V37) ; listes pour le marketing (FR-V29 ; `garde-fous.ts:86-93`). Le manifeste `pdv` déclare `depends: [reseau]`, `enrichiPar: [stock, commande, facturation, terrain, recouvrement, catalogue]`, neuf droits `pdv:*` et deux objets de reprise (`pdv.point-de-vente@1`, `pdv.affectation@1`).

**Écarts à porter au PRD du module.**

#### FR-184 : Le score de santé ne s'affiche qu'avec sa provenance, et il a un producteur dès le premier jour
La démo calcule un « Score santé IA » (`PdvRapportView.tsx:80-84`) et un « Scoring IA temps réel » (`PointsDeVenteView.tsx:217-218,303`), l'affiche sur chaque fiche et le montre aussi au commercial et au freelance. Le PRD (FR-V34, FR-V35, FR-V36) interdit à `pdv` de calculer un score, exige source, date et version de modèle, et interdit d'afficher un score sans provenance comme un fait ; la clause C11 (point 6) répète la règle. La démo n'affiche ni source, ni date, ni version. Décision du PO du 2026-11-12 : le score de santé du premier jour est une **règle de `dashboard`** (scoring déterministe, version `règles-1.0`), **déposée dans `pdv` avec sa provenance** par un contrat nommé (`dashboard.score-pdv.calcule@1`). Le module de scoring différé de FR-V36 pourra la remplacer plus tard, par le même contrat.
La règle `règles-1.0` reprend la seule règle explicite de la démo : le score (0 à 100) est plafonné à 45 dès qu'une créance du point de vente est échue depuis plus de 30 jours. Couleurs : vert à 70 et plus, ambre à 40 et plus, rouge en dessous (paramètres).
**Conséquences (testables) :** (1) tout score affiché porte, à côté, sa source, sa date et sa version ; un score sans ces trois éléments s'affiche « non évalué », jamais en chiffre ; (2) sans `dashboard` installé, le champ est déclaré vide et visible comme tel (FR-V36), et le test C4 vérifie `NON_INSTALLE` ; (3) la fiche d'un commercial ou d'un freelance ne montre que les scores de **son** portefeuille ; (4) un score de plus de 30 jours porte un libellé « périmé » (seuil par défaut, paramétrable) ; (5) sur le jeu de test, un point de vente dont la créance la plus ancienne est échue depuis 31 jours a un score de 45 au plus.

#### FR-185 : Le pipeline a six états dans la démo, cinq dans le PRD
La démo : `PROSPECTION`, `PREMIER_CONTACT`, `PREMIERE_COMMANDE`, `ACTIF`, `FIDELE`, `A_RISQUE` (`types/index.ts:17-23`). Le PRD (FR-V15) : prospection → actif → fidèle, plus `à risque` et `perdu`. La démo a deux états de plus (premier contact, première commande) et pas de `perdu`. Décision : les **sept** états sont ceux de la démo plus `perdu`, car `perdu` est exigé par FR-V15 et le recouvrement en a besoin ; les libellés viennent de la donnée (`pipelineLabels`), conformément à FR-V17 (règles du distributeur), et `PREMIER_CONTACT` / `PREMIERE_COMMANDE` sont des états configurables que le distributeur peut désactiver.
**Conséquences (testables) :** (1) la liste des états d'un distributeur installé contient `PROSPECTION`, `PREMIER_CONTACT`, `PREMIERE_COMMANDE`, `ACTIF`, `FIDELE`, `A_RISQUE`, `PERDU` ; (2) désactiver `PREMIER_CONTACT` fait passer un prospect directement de `PROSPECTION` à `PREMIERE_COMMANDE` sans erreur ; (3) l'état n'est jamais repris de Sage : il se recalcule par les règles (décision du PO, 2026-11-12), et un lot repris ne porte aucun état ; (4) aucune règle de transition n'est du code : la garde de balayage de C6 ne trouve aucune comparaison à un libellé de client.

#### FR-186 : « Vue DG » : le commercial et le freelance n'ont pas les écrans de pilotage
La démo montre à un commercial une fiche étiquetée « Vue DG » (classement de zone, priorités du DG) au lieu de sa dernière visite, de ses relances et de son objectif du mois ; le responsable des ventes et le superviseur voient la même vue (`AUDIT_PERSONAS_AMELIORATIONS.md:21-27`). Le PRD pdv fournit les droits distincts « mon portefeuille » et « tout le réseau » (FR-V38). Ce PRD exige trois vues de la fiche, choisies par le droit, jamais par un nom de rôle : **vue de portefeuille** (commercial, freelance, prospection : dernière visite avec résultat et commentaire, relances à faire, objectif du mois, bouton « Appeler »), **vue de zone** (superviseur, responsable des ventes), **vue de direction** (DG, directeur commercial seulement, FR-7). Chaque vue est servie sur le périmètre du lecteur, filtré par le serveur (FR-6).
Les relances à faire sont au plus quatre, issues des dossiers de recouvrement ouverts du point de vente (FR-113). « Appeler » ouvre le numéro du point de vente (`tel:`), action locale du téléphone, sans enregistrement ; l'appel enregistré est « bientôt ». Les six indicateurs de la liste (chiffre d'affaires, enseignes, partenaires, impayés, à risque, prospection) se recalculent sur le périmètre du lecteur et portent son libellé (« CA de mon portefeuille » pour un commercial) ; le badge « échantillon réseau 1 847 » de la démo disparaît.
**Conséquences (testables) :** (1) un compte sans le droit `pdv:reseau:consulter` n'obtient ni le rang de zone, ni les priorités du DG, y compris par une URL saisie à la main ; (2) un commercial ouvre une fiche et y voit la date, le résultat et le commentaire de sa dernière visite ; (3) la bascule entre vues est un fait de droit : retirer `pdv:reseau:consulter` à un DG test retire la vue de direction ; (4) sans `terrain` installé, « dernière visite » affiche `NON_INSTALLE` ; (5) aucun rôle autre que DG et DC ne voit la mention « Vue DG » ni la vue de direction (annexe B) ; (6) le total « impayés » de la liste d'un commercial égale la somme des créances de son seul portefeuille.

#### FR-187 : Plafond de crédit du client : le disponible à crédit est montré
Aucune fiche de la démo ne montre de plafond (seuls les fournisseurs en ont : `FicheFournisseur.tsx:109-112`) ; la proforma avertit seulement qu'un encours existe (`ProformaBuilder.tsx:302`). Le PRD porte le plafond, sa devise, sa suspension et son journal (FR-V30 à FR-V33) et ne l'applique pas (FR-V31). Ce PRD exige que la fiche et la saisie de commande montrent **plafond − encours = disponible à crédit**, et que le plafond soit repris de Sage (valeur de contrôle `PLAFOND_SANS_OBJET` pour un magasin propre).
**L'encours** d'un tiers = créances ouvertes (registre de `paiement`, FR-247) + commandes validées non encore facturées (`commande`) − crédit du tiers (`paiement`, FR-248). Le plafond vient de `pdv`. Le plafond se juge sur l'encours, jamais sur les seules factures.
**Conséquences (testables) :** (1) sur le jeu de test, un client au plafond de 2 000 000 FCFA, avec 1 200 000 FCFA de créances ouvertes, 400 000 FCFA de commandes validées non facturées et 100 000 FCFA de crédit du tiers, a un encours de 1 500 000 FCFA et affiche un disponible de 500 000 FCFA ; (2) sans `paiement` ou sans `commande`, l'encours et le disponible affichent `NON_INSTALLE`, et jamais 0 ni le plafond entier ; (3) `commande` **refuse** une commande dont l'encours dépasserait le plafond, ou dont le tiers a son crédit bloqué (FR-189) ; jamais `pdv` ; (4) un plafond modifié sans motif est refusé (FR-V32) ; (5) après la reprise, la somme des plafonds repris égale la valeur de contrôle du lot ; (6) deux validations simultanées de 600 000 FCFA sur un disponible de 1 000 000 FCFA : une seule passe, l'autre est refusée avec son motif.

#### FR-188 : Les conditions de règlement par client sont une exigence, pas un champ de texte
La démo connaît les modes `ESPECES`, `VIREMENT`, `CHEQUE`, `CREDIT_30J`, `CREDIT_45J`, `CREDIT_60J` (`types/index.ts:101`, `ProformaBuilder.tsx:19`) mais aucune fiche client ne les porte. Le manifeste `pdv` couvre « plafond, conditions de règlement » (`pdv:plafond:modifier`), et FR-V30 les cite, mais le PRD pdv n'a aucune exigence propre à leur sujet. Exigence : une **condition de règlement par défaut** par client, choisie dans un référentiel versionné du distributeur (comptant, 30 j, 45 j, 60 j, fin de mois…), reprise de Sage, lue par `commande` et `facturation` pour calculer l'échéance.
**Conséquences (testables) :** (1) une facture émise à un client « 30 jours » porte une échéance égale à la date de facture + 30 jours ; (2) changer le référentiel (ajouter « 90 j ») n'exige aucun déploiement ; (3) un client sans condition reçoit la condition par défaut de l'organisation, et le dit ; (4) le fichier clients de février reprend la condition, et une valeur inconnue du référentiel est rejetée avec la ligne du fichier dans le rapport de la Reprise.

#### FR-189 : L'état « crédit bloqué » est une suspension du plafond, décidée par `recouvrement`, écrite par `pdv`
La démo bloque et débloque le crédit depuis le recouvrement (`BalanceAgeeClientPanel.tsx:152-158`), avec trace des surcharges (`:27-29`), et exclut un client « crédit bloqué » du marketing (`garde-fous.ts:50-57`). Le PRD laisse le blocage à Commande ou Facturation (FR-V31) et prévoit la **suspension** du plafond sans l'effacer (FR-V33). Décision : bloquer le crédit = suspendre le plafond. `recouvrement` décide et publie `recouvrement.credit.bloque@1` ; `pdv`, seul propriétaire du plafond (C3), applique la suspension et republie `pdv.plafond.changed@1` ; `commande` et `facturation` lisent ce second fait. C'est le seul chemin du blocage. Le déblocage suit le même chemin.
Les seuils sont ceux de la table unique du recouvrement (FR-114, paramétrable) : J+1, rappel ; J+30, alerte à la direction ; créance échue depuis plus de 60 jours, ou encours au-dessus du plafond (FR-187) : **blocage automatique du crédit**. Ce blocage automatique est une règle auditée, exception explicite à FR-158. Le déblocage n'est **jamais automatique** : seul le DAF le décide. Le blocage est un fait du noyau (`recouvrement`, §6.0) : une verticale sans `pdv` le lit directement dans `recouvrement.credit.bloque@1`.
**Conséquences (testables) :** (1) un blocage décidé par `recouvrement` produit une suspension visible dans le journal du plafond de `pdv`, avec auteur, motif et référence du dossier ; (2) le plafond n'est pas remis à zéro et revient à sa valeur au déblocage ; (3) `commande` refuse une commande à crédit sur un client suspendu et accepte la même commande au comptant ; (4) sans `recouvrement`, aucun blocage automatique ne se produit et l'écran de blocage manuel de `pdv` reste disponible au détenteur de `pdv:plafond:modifier` ; (5) une créance échue depuis 61 jours bloque le crédit sans action humaine, et le journal nomme la règle ; (6) le paiement complet de la créance ne lève pas le blocage : le tiers reste bloqué jusqu'à la décision du DAF.

#### FR-190 : L'écran de création et de modification d'un point de vente est à créer
La démo n'a aucun formulaire de création de point de vente. Le PRD exige l'identité, la géolocalisation et les photos (FR-V03, FR-V04), le dédoublonnage (FR-V06), la fermeture (FR-V07) et le droit `pdv:fiche:creer`. Écran à créer : formulaire de création (nom, contacts, zone, nature, commercial, position sur la carte Google Maps, conditions de règlement, plafond), contrôle des doublons avant enregistrement (téléphone d'abord, proximité ensuite), fermeture avec motif.
**Conséquences (testables) :** (1) créer un point de vente dont le téléphone existe déjà propose la fiche existante avant enregistrement ; (2) un point de vente sans position GPS est enregistré et signalé « non géolocalisé », jamais refusé ; (3) le point créé apparaît dans « Mon portefeuille » du commercial affecté au rechargement ; (4) un utilisateur sans `pdv:fiche:creer` ne voit pas le bouton « Nouveau point de vente ».

#### FR-191 : Les indicateurs commerciaux du point de vente ont chacun un module producteur
La fiche de la démo calcule CA du mois, évolution, CA moyen sur 6 mois, panier moyen, bons de livraison par mois, délai de livraison, taux de service et rang de zone (`PdvRapportView.tsx:112-120`). Le PRD pdv n'agrège que ce que les autres modules fournissent (FR-V22, FR-V24). Attribution : CA mois, évolution, CA moyen 6 mois, panier moyen → `facturation` (faits facturés) ; bons de livraison par mois, délai de livraison, taux de service → `commande` et `entrepot` ; rang de zone → `dashboard` (FR-182) ; « Stock en rupture au PDV » et « Assortiment & évolution produits » (`PdvRapportView.tsx:205-215,265`) → `stock` (FR-S56 à FR-S60) et `commande`.
**Conséquences (testables) :** (1) chaque indicateur de la fiche porte sa source et sa fraîcheur (FR-V23) ; (2) désinstaller un module producteur affiche `NON_INSTALLE` sur ses seuls indicateurs, la fiche reste ouverte ; (3) `pdv` ne contient aucune collection de chiffre d'affaires (garde de câblage C3).

#### FR-192 : La carte est Google Maps (le front de démo est en Leaflet)
La démo dessine la carte avec Leaflet et OpenStreetMap (`CarteCommercialDG.tsx:3-5`). La décision du PO du 2026-11-12, déjà au manifeste `pdv` (prérequis `fond-de-carte`), est Google Maps. Cette décision, postérieure et explicite, l'emporte sur la démo. Toute carte du produit (points de vente, équipe en temps réel, zones blanches, tournées) utilise le même fond.
**Conséquences (testables) :** (1) le prérequis `fond-de-carte` du manifeste est vérifié à l'installation, et son échec laisse la liste utilisable avec une carte vide et le message d'action ; (2) aucune dépendance Leaflet ni tuile OpenStreetMap dans le module d'écran livré (analyse des dépendances) ; (3) `terrain` n'embarque pas son propre fond de carte : il appelle le composant commun.

#### FR-240 : Les alertes de la liste et de la fiche du point de vente ont une règle écrite
La démo signale des points de vente sans règle exposée (`PointsDeVenteView.tsx`, `PdvRapportView.tsx`). Ce PRD écrit les règles, toutes paramétrables, au modèle unique d'alerte (FR-14). Chaque alerte se calcule à partir du module qui a la donnée ; `pdv` ne fait que l'afficher.
- **Pastilles de la liste** : « Impayé N j » si la plus ancienne créance échue a plus de 30 jours (`paiement`) ; « Inactif N j » si aucune commande depuis plus de 21 jours alors que le chiffre d'affaires du mois est supérieur à 0 (`commande`, `facturation`) ; « N ruptures » si des articles sont en rupture au point de stock qui sert ce point de vente (`stock`).
- **Alertes de la fiche** : CRITIQUE si une créance est échue depuis plus de 30 jours ; HAUTE si une créance est ouverte ; HAUTE si aucune commande depuis plus de 21 jours ; MODÉRÉE si le délai moyen de livraison dépasse 3 jours (objectif 1,5 jour) ; HAUTE si un article est en rupture ; MODÉRÉE si le point de vente est partenaire et que sa zone compte au moins 75 % de partenaires.
**Conséquences (testables) :** (1) sur le jeu de test, un point de vente dont la créance la plus ancienne est échue depuis 31 jours porte la pastille « Impayé 31 j » et l'alerte CRITIQUE ; (2) sans le module source, la pastille ou l'alerte affiche « non installé », jamais rien ; (3) changer le seuil de 21 jours n'exige aucun déploiement ; (4) un commercial ne voit les alertes que de son portefeuille.

#### FR-241 : Un « client comptoir » générique par point de stock
Décision du PO du 2026-11-12 : une commande exige un point de vente ; il n'y a pas de vente anonyme. Pour la vente au comptoir (FR-221), `pdv` crée à l'installation un point de vente générique « client comptoir » par point de stock (Lomé Port, Kara). Il est sans commercial titulaire et sans crédit : condition de règlement « comptant », plafond `PLAFOND_SANS_OBJET`. Comme il n'a pas de crédit, la règle de blocage par l'encours (FR-189) ne s'applique pas à lui.
**Conséquences (testables) :** (1) créer un point de stock crée son client comptoir, et le fermer le ferme ; (2) une commande à crédit sur un client comptoir est refusée, la même au comptant passe ; (3) le client comptoir n'entre ni dans le pipeline, ni dans la couverture, ni dans les campagnes ; (4) il n'est jamais repris de Sage.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : géolocalisation et photos du point de vente (FR-V03, FR-V04) ; dédoublonnage et fusion (FR-V06) ; fermeture (FR-V07) ; propriété du portefeuille, réaffectation par lot, départ d'un commercial et révélation des prix d'un indépendant, points sans commercial (FR-V09 à FR-V14) ; transition expliquée, correction avec motif, historique (FR-V16 à FR-V21) ; source et fraîcheur de chaque élément (FR-V23) ; cache hors connexion du portefeuille (FR-V25, FR-V25b ; la démo ne parle que de la file d'attente d'une proforma) ; zones blanches (FR-V28) ; plafond et suspension (FR-V30 à FR-V33) ; droits et règles de pipeline (FR-V38, FR-V39) ; import (FR-V40) ; audit (FR-V43). **Tous ces écrans sont voulus** (décision du PO du 2026-11-12 : « pour le moment je veux les voir tous ; en fonction de l'évolution on va voir »). Le cache hors connexion vient avec l'application terrain.

---

### 7.3 ★ Catalogue (`catalogue`, M04) — PRD `prd-catalogue-produits-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Référence, nom, catégorie d'un produit (FR-C01, FR-C05 ; `types/index.ts:86-99`) ; un prix unitaire seul (FR-C13, partiel) ; combos, promotion, remise (FR-C18, FR-C19, partiels ; `combo-stock-workflow.ts`) ; rentabilité, rotation, engouement par produit (FR-C35 à FR-C38, partiels ; `catalogue-dg-builder.ts:64-72`). Le manifeste `catalogue` : `depends: []`, `enrichiPar: [reseau, pdv, stock, commande]`, quatre droits (FR-C48), deux objets de reprise (`catalogue.article@1`, `catalogue.grille@1`). La démo n'a pas de module catalogue séparé : `/catalogue` redirige vers `/stock?tab=catalogue` (douze articles, vues consolidée, par entrepôt, réseau).

**Écarts à porter au PRD du module.**

#### FR-193 : Le prix négocié d'un client est une grille dont la condition est « ce point de vente »
Le client de février demande la reprise des **prix propres à chaque client** (brain dump du PO). La démo ne montre jamais un prix résolu par client. FR-C14 ne prévoit comme conditions de grille que la zone, la catégorie de client et le seuil de volume. Décision du PO du 2026-11-12 : le prix négocié par client est porté par une **grille « ce client »** du `catalogue`, c'est-à-dire une grille dont la condition est « point de vente » (référence opaque vers `pdv`, comme la zone l'est vers `reseau`, voir l'hypothèse A2 du PRD catalogue). Le PRD catalogue est amendé : FR-C14 est étendue, et `catalogue.grille@1` complétée. Une catégorie de client à un seul membre n'est pas retenue, car elle fabrique une catégorie par client. Les prix négociés propres à un client ne s'appliquent jamais à un freelance (FR-93).
**Conséquences (testables) :** (1) sur le jeu de test, un article à 4 500 FCFA au tarif société et à 4 200 FCFA pour un client nommé résout 4 200 FCFA pour ce client et 4 500 FCFA pour les autres, avec la grille résolue citée dans la ligne de commande ; (2) la priorité de résolution met la condition « point de vente » avant « catégorie » puis « zone », de la plus précise à la plus large ; l'ordre est une donnée de priorité explicite (FR-C16) ; (3) la reprise de Sage de 1 000 tarifs clients crée des grilles sans condition de catégorie fabriquée ; (4) un prix négocié sans prix société correspondant est signalé à la reprise, pas inventé ; (5) un export de `catalogue.grille@1` ne contient jamais de prix freelance (FR-C29) ; (6) avec 36 000 lignes de grilles « ce client » (600 clients × 60 articles), la résolution d'un prix à la saisie répond en moins de 200 ms.

#### FR-194 : L'unité de base et le conditionnement manquent à la démo
La démo ne connaît le carton que dans un nom de produit fournisseur (« Eau de Javel 1L (carton 12) », `commandes-fournisseurs-registry.ts:63`), dans `quantite_lot` (`types/index.ts:246-247`) et dans `unites_par_palette` (`entrepot-logistique-registry.ts:93-94`). Le PRD (FR-C06 à FR-C12) exige une unité de base immuable, des conditionnements à facteur versionné et un prix par article **et par unité** (FR-C13). Pour les jus et boissons, ce PRD exige que bouteille, pack et palette soient des conditionnements d'un même article, que tout stock soit tenu en unité de base, et que la commande, la facture et le bon de livraison portent l'unité vendue.
**Conséquences (testables) :** (1) un article « jus d'orange 1 L » a l'unité de base « bouteille » et les conditionnements « pack de 6 » et « palette de 120 packs » ; vendre 2 packs décrémente 12 bouteilles ; (2) changer le facteur d'un pack ne modifie aucun mouvement passé ; (3) un texte libre « carton 12 » repris de Sage est traduit par le gabarit de reprise, jamais inventé ; une ligne non traduisible est rejetée au rapport ; (4) le prix du pack n'est pas imposé comme 6 fois celui de la bouteille.

#### FR-195 : `marge_freelance` et `montant_client` ne sont pas montrés à la société
La démo expose `montant_societe`, `montant_client` et `marge_freelance` dans une commande (`commandes-registry.ts:69-70`), une « grille prix client » du freelance (`commercial-terrain-dg-builder.ts:87`) et un « CA société généré ». FR-C29 interdit à la société de voir les prix pratiqués par un freelance chez ses détaillants : aucune requête, aucun export, aucun tableau de bord, aucune restitution. `montant_client` dans la vue de commande du DG contredit FR-C29. Règle de ce PRD, quelle que soit la démo : la société voit **le montant société** (prix société résolu, FR-C31) ; elle ne voit jamais ni le prix client du freelance, ni sa marge ; le freelance voit les deux, pour son seul portefeuille (FR-C30).
Décision du PO du 2026-11-12 : le freelance **vend pour le compte de la société**. Il n'achète pas de stock : le stock reste à la société jusqu'à la livraison au détaillant. Il facture le détaillant au prix qu'il négocie ; il doit le prix société à la société, même si son détaillant ne paie pas ; la société lui verse une commission calculée sur le prix société. Sa vente est servie par le stock de la société.
**Conséquences (testables) :** (1) un compte DG, sur une commande d'un freelance, ne reçoit ni `montant_client` ni `marge_freelance` dans la réponse de l'API (test au niveau des données, pas de l'écran, FR-C29) ; (2) l'export CSV, le tableau de bord de direction et le rapport IA ne contiennent aucun de ces deux champs ; (3) à l'événement de départ du freelance (`pdv.commercial.parti@1`), la révélation des prix produit `catalogue.revelation.effectuee@1` et seulement alors ; (4) le seuil de remise et les alertes de marge du DG se calculent sur le montant société ; (5) le PDF remis au détaillant porte le prix du freelance seul, jamais le prix société ; (6) le libellé est « prix société », jamais « coût d'achat » ni « votre coût ».

#### FR-196 : La visibilité de la marge par rôle (société) manque au PRD catalogue
La démo cache la marge commerciale à certains rôles : « le responsable stock arbitre en coût d'achat » (`StockView.tsx:142`, `voitValeurCommerciale`). Le PRD catalogue n'a de visibilité par rôle que pour les prix freelance. Exigence : un droit de consultation du **prix de revient et de la marge société**, `catalogue:marge:consulter` (nom par défaut), distinct du droit de consulter les articles (`catalogue:article:consulter`), attribuable par rôle.
La démo donne quatre droits logistiques par poste (`perimetre-logistique.ts`). Ils deviennent des droits attribués par défaut (annexe B.2), modifiables :

| Poste | Voir la valeur d'achat | Voir la valeur commerciale (marge) | Engager (transfert, liquidation) | Paramétrer le réappro | Périmètre |
|---|---|---|---|---|---|
| DG | oui | oui | oui | oui | tout le réseau |
| DC, DAF | oui | oui | oui | non | tout le réseau |
| RESP_STOCK | oui | non | oui | oui | tout le réseau |
| GEST_ENTREPOT | non | non | non | non | son entrepôt |
| autres rôles | non | non | non | non | aucun |

**Conséquences (testables) :** (1) un compte avec `catalogue:article:consulter` seul voit prix de vente et conditionnements, pas le coût de revient ni la marge ; (2) l'ajout du droit passe par `auth-service` (catalogue des droits fermé, C7) avant la livraison ; (3) le responsable de stock voit la valeur d'achat de son stock et jamais la valeur commerciale, comme dans la démo, **y compris dans la vue catalogue**, où la démo montrait la marge à tous ; (4) le gestionnaire d'entrepôt ne voit ni prix, ni marge, ni chiffre d'affaires.

#### FR-197 : Le catalogue a ses propres écrans, il n'est plus un onglet du stock
La démo range le catalogue dans `/stock?tab=catalogue`. Un module `catalogue` installable seul a besoin d'un module d'écran propre (C8) : liste des articles, fiche article, grilles, promotions, simulation de prix (FR-C27). L'onglet « Catalogue » du stock devient un lien vers le module d'écran, visible seulement si `catalogue` est installé.
**Conséquences (testables) :** (1) une organisation avec `catalogue` sans `stock` voit le menu « Catalogue » et aucune entrée de stock ; (2) une organisation avec `stock` (qui exige `catalogue` en dépendance dure) retrouve les douze articles du jeu de test dans le catalogue ; (3) l'URL `/catalogue` ne redirige plus vers `/stock`.

#### FR-198 : Le coût de revient vient du stock, pas du catalogue
Marge par article, « rentabilité » (`DEFICITAIRE`, `TENSION`, `CORRECTE`), rotation en jours, engouement et ruptures sur 3 mois (`CatalogueView.tsx:154-160`) sont de l'analyse. Le coût de revient (`cout_revient`, `catalogue-dg-builder.ts:64`) vient de la valorisation du stock (FR-S23, FR-S24), non du catalogue. Ce PRD place cette analyse dans `dashboard` (écran « Pilotage catalogue & assortiment »), qui lit `catalogue`, `stock`, `facturation`.
**Conséquences (testables) :** (1) sans `stock`, l'écran n'affiche ni coût de revient ni marge (`NON_INSTALLE`) ; (2) `catalogue` ne contient aucun champ de coût (test de schéma) ; (3) la rentabilité d'un article se recalcule quand la valorisation du stock change.

#### FR-242 : Les attributs logistiques d'un article
Sans poids ni volume, le chargement des camions (FR-70) et les bons de préparation (FR-68) ne se calculent pas. La démo les porte dans une fiche logistique (`entrepot-logistique-registry.ts:82-113`) ; aucun objet du PRD catalogue ne les a. Exigence d'amendement du PRD catalogue : chaque article porte, **par unité de base**, un poids (kg) et un volume (m³), convertis pour chaque conditionnement par son facteur (FR-194) ; le nombre de colis par palette ; les indicateurs `fragile` et `froid`. L'emplacement et l'allée d'un article sont propres à un point de stock : ils appartiennent à `stock` (FR-S02), pas au catalogue. Le coût d'achat n'est jamais au catalogue (FR-198).
Gabarits de la démo, valeurs par défaut par catégorie (poids d'un colis, colis par palette) : boissons 12,5 kg et 84 ; alimentaire 9 kg et 60 ; hygiène 5,5 kg et 72 ; entretien 7,5 kg et 66. Le jeu « Grossiste du Golfe » (FR-9) renseigne chaque article ; ses jus et boissons partent du gabarit « boissons ».
**Conséquences (testables) :** (1) un article sans poids ni volume est signalé « non chargeable » au plan de chargement, jamais compté à zéro ; (2) le poids d'une commande de 2 palettes d'un article à 84 colis de 12,5 kg vaut 2 100 kg ; (3) modifier le poids d'un article ne modifie aucun chargement déjà validé ; (4) les attributs se reprennent de Sage s'ils y sont, sinon le gabarit de la catégorie s'applique et le rapport de reprise le dit.

#### FR-243 : Rentabilité et engouement d'un article ont une règle chiffrée
La démo classe chaque article par rentabilité et par engouement (`catalogue-dg-builder.ts:130-139`) ; le PRD catalogue cite ces notions (FR-C35 à FR-C38) sans règle. Exigence d'amendement : FR-C35 à FR-C38 reçoivent les définitions ci-dessous. Le calcul est fait là où sont les données, par l'écran « Pilotage catalogue & assortiment » de `dashboard` (FR-198) ; le résultat porte sa règle, sa version et sa date (FR-16). Seuils par défaut, paramétrables :
- **Rentabilité** (évaluée dans cet ordre) : `FORTE` si la marge est d'au moins 14 % et sans rupture ; sinon `TENSION` si rupture et au moins 3 ruptures sur 3 mois ; sinon `DEFICITAIRE` si la marge est inférieure à 10 % ou la rotation supérieure à 28 jours ; sinon `TENSION` si rupture ou marge inférieure à 11 % ; sinon `CORRECTE`.
- **Engouement** (évolution de la demande) : `FORT` à +10 % ou plus ; `EN_CHUTE` à −15 % ou moins ; `FAIBLE` à −5 % ou moins ; sinon `STABLE`.
- La marge vient des factures (FR-53) et du coût de revient du stock (FR-201) ; la rotation, du stock. Le stock immobilisé se valorise au **coût d'achat** (la démo le valorisait au prix de vente).
**Conséquences (testables) :** (1) un article à 15 % de marge sans rupture est `FORTE` ; le même avec une rupture et 3 ruptures sur 3 mois est `TENSION` ; (2) un article à 9 % de marge est `DEFICITAIRE` ; (3) une demande à −16 % donne `EN_CHUTE` ; (4) sans `stock` ou sans `facturation`, la rentabilité affiche « non installé » ; (5) les combos d'écoulement (FR-144) lisent ces deux états, jamais un libellé saisi.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : références stables, identifiants externes, médias (FR-C02 à FR-C04) ; unité de base et conditionnements (FR-C06 à FR-C12, voir FR-194) ; grilles, conditions, priorité, versions (FR-C13b à FR-C17) ; cumul, plafonds de promotion, résolution du prix, simulation (FR-C20 à FR-C27) ; prix figé (FR-C25) ; « pas de prix » (FR-C26) ; cycle de vie et remplacement d'un article (FR-C41 à FR-C44) ; import et export (FR-C45 à FR-C47) ; droits et audit (FR-C48, FR-C49) ; l'écran « Mes prix » du freelance (FR-C28 à FR-C30). **Tous ces écrans sont voulus** (décision du PO du 2026-11-12 : « pour le moment je veux les voir tous ; en fonction de l'évolution on va voir »).

---

### 7.4 ★ Stock (`stock`, M06) — PRD `prd-stock-2026-08-02`

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

#### FR-202 : Préparation, picking et camions vivent dans `entrepot` ; transferts et liquidation dans `stock`
La démo a des outils absents du PRD stock : préparation de commandes, vagues de picking, expéditions du jour, chargement des camions (poids, volume, palettes ; `expedition-engine.ts:148-202`), transferts entre entrepôts (`TransfertsPanel.tsx`), « Plan de liquidation » (`PlanLiquidationPanel.tsx:56`), « Journal d'automatisation » du réapprovisionnement (`automation-journal.ts:112-143`), coupure camion, affectation des préparateurs. Renvoi : préparation, picking, vagues, expédition, chargement, réception avec litige, contrôle au quai → module `entrepot` (partie 2) ; **santé du stock, transferts et plan de liquidation → `stock`** (amendement du PRD stock : FR-244 à FR-246) ; combos d'écoulement → `marketing` (FR-144) ; journal d'automatisation → `automatisations` ; réapprovisionnement → `approvisionnement`. « Lancer la navette » et « Lancer le scénario » appartiennent à `stock`. `stock` reste la source des quantités et des alertes (`stock.alerte.changed@1`) et publie les faits que ces modules lisent.
**Conséquences (testables) :** (1) `stock` installé seul n'affiche ni onglet « Picking », ni « Camions » ; il affiche « Santé », « Transferts » et « Liquidation » au détenteur des droits (FR-196) ; (2) installer `entrepot` ajoute ses écrans sans modifier `stock` ; (3) un scénario de liquidation qui vise un autre module (campagne, retour fournisseur) crée l'objet dans ce module par son contrat, jamais dans sa base ; sans ce module, le scénario affiche « non installé ».

#### FR-203 : La réservation du stock s'active avec `commande`, pas avant
La démo dit elle-même qu'elle ne réserve pas (`PreparationPanel.tsx:277`, « le stock correspondant n'est pas réservé »). Le PRD prévoit `réservé` engagé par une commande non livrée (FR-S08, FR-S08c) et fixe `réservé = 0` en v1. Décision : la réservation est active **dès que `commande` est installé** et que la commande est validée ; sans `commande`, `réservé` est un emplacement déclaré `NON_INSTALLE`. À l'écran « disponibilité » du commercial, les trois états (disponible, limité, rupture) se calculent sur le **disponible** (physique − réservé), la quantité exacte n'étant montrée qu'à qui détient `stock:etat:consulter`. `LIMITE` si disponible ≤ seuil ; `RUPTURE` si disponible ≤ 0 (une seule définition du seuil, « inférieur ou égal », pour tout le produit).
Décision du PO du 2026-11-12 : la réservation se fait **à la validation** ; l'allocation du matin par priorité ne porte que sur les commandes **en attente de stock**. Si le crédit du client est bloqué après la validation, la réservation reste jusqu'à l'annulation de la commande ou au déblocage ; au-delà de 7 jours (défaut, paramétrable), une alerte va au responsable des ventes.
**Conséquences (testables) :** (1) valider une commande de 40 unités sur un stock physique de 100 fait passer le disponible à 60 et laisse le physique à 100 ; (2) annuler la commande rend les 40 ; (3) le seuil « limité » est un paramètre de l'organisation, non du code ; (4) sans `commande`, la colonne `réservé` n'est ni 0 ni vide mais `NON_INSTALLE` ; (5) l'allocation du matin ne retire jamais une réservation déjà faite ; (6) une commande validée dont le client est bloqué depuis 8 jours garde sa réservation et produit une alerte au responsable des ventes.

#### FR-204 : Taux de service et ruptures sur trois mois : calcul hors `stock`
`StockView.tsx:186,339` montre le taux de service et `:189,408` les ruptures sur 3 mois ; le PRD stock n'a pas ces indicateurs. Ils combinent des lignes de commande servies ou non (`commande`, `entrepot`) et des alertes de rupture (`stock`) : ils sont produits par `dashboard`, qui les lit. 
**Conséquences (testables) :** (1) le taux de service est le quotient des quantités livrées sur les quantités commandées de la période, avec la formule affichée à côté du chiffre ; (2) sans `commande`, il affiche `NON_INSTALLE`, jamais 100 % ; (3) `stock` n'expose aucun champ de taux de service.

Les trois exigences suivantes portent les règles chiffrées de la démo (`transferts-engine.ts`, `liquidation-engine.ts`, `reappro-engine.ts`) que le PRD stock cite sans chiffres (FR-S40 à FR-S46, FR-S52 à FR-S55). Elles amendent le PRD stock. Toutes les constantes sont des paramètres de l'organisation, avec ces valeurs par défaut. Chaque résultat porte sa règle, sa version et sa date (FR-16).

#### FR-244 : Le statut et la santé du stock se calculent
La démo saisit à la main le statut d'un article et sa couverture (`stock-dg-builder.ts:73-224`). Ce PRD exige qu'ils soient calculés, par article et par point de stock.
- **Couverture** (jours) = stock ÷ (ventes des 30 derniers jours ÷ 30), arrondie au dixième ; 999 si la vitesse est nulle.
- **Statut** : `CRITIQUE` si disponible ≤ 0,5 × seuil ou couverture < 3 jours ; `ALERTE` si disponible ≤ seuil ou couverture < couverture minimale (7 jours) ; `SURSTOCK` si couverture > 60 jours ; sinon `OK`.
- **Diagnostic de santé** : `DORMANT` si la vitesse est inférieure à 0,5 unité par jour et le stock positif ; `SURSTOCK` si couverture > 60 jours ; date limite menacée si couverture > 0,6 × durée de vie restante. Ordre : `OBSOLETE` si dormant et couverture > 300 jours ; sinon, si la date limite est menacée, `DLC_COURTE` quand la durée de vie restante est de 60 jours ou moins, `SURSTOCK` sinon ; sinon `DORMANT` si dormant ; sinon `SURSTOCK`.
- **Capital immobilisé** = stock × coût d'achat (valorisation, FR-201). **Coût de portage** : 22 % par an. **Perte si rien n'est fait** : date limite courte = (stock − vitesse × durée de vie restante) × coût ; obsolète = 40 % du capital ; sinon capital × 22 % × (min(couverture, 720) − 60) ÷ 365.
- **Gravité** : `CRITIQUE` si la perte dépasse 30 % du capital, `HAUTE` au-delà de 12 %, sinon `MODEREE`. Un déstockage est proposé si le problème n'est pas `DORMANT` ou si la couverture dépasse 120 jours. **Part dormante** = capital (dormant + surstock) ÷ capital total.
**Conséquences (testables) :** (1) un article à 88 unités disponibles pour un seuil de 100, et 10 jours de couverture, est `ALERTE` ; (2) un article vendu à 0,3 unité par jour avec du stock est `DORMANT` ; à plus de 300 jours de couverture, il est `OBSOLETE` ; (3) recalculer le statut d'un article à partir de ses mouvements et de ses ventes redonne la valeur affichée ; aucun statut ne se saisit ; (4) l'onglet « Santé » n'est visible qu'avec le droit de voir la valeur d'achat (FR-196).

#### FR-245 : Les transferts entre points de stock et « Lancer la navette »
La démo propose des transferts entre Lomé Port et Kara, et « Lancer la navette » n'écrit qu'un journal local, sans déplacer le stock (`TransfertsPanel.tsx:182-195`). Règles :
- Un point de stock est **en manque** si disponible ≤ seuil ou couverture < couverture minimale (7 jours). La vitesse d'un site = vitesse du réseau × part des ventes du site.
- Un site ne cède que si sa couverture atteint 25 jours. Quantité cessible = stock source − (vitesse source × 25 jours), arrondie à l'unité supérieure pour la part gardée. Cible du site en manque = vitesse × max(2 × couverture minimale, 14 jours). Quantité transférée = min(quantité cessible, cible − stock du site en manque).
- **Coût** = rotations × (coût de mise en route + distance × coût au kilomètre), avec rotations = poids ÷ charge utile du camion, arrondi au supérieur, et distance entre Lomé Port et Kara = 420 km. **Délai** : 1 jour, 2 jours s'il faut plusieurs rotations.
- **Économie nette** = coût du réappro fournisseur évité + coût de rupture évité − coût du transfert ; coût de rupture évité = vitesse × (délai fournisseur − délai de transfert) × (prix − coût d'achat).
- **Urgence** : `CRITIQUE` si la couverture du site en manque est inférieure à 3 jours ; `HAUTE` si disponible ≤ seuil ; sinon `OPPORTUNITE`.
- Un transfert de coût ≤ 250 000 FCFA et d'urgence non critique peut partir seul (mode `AUTO`, éteint par défaut). Sinon il attend la décision d'un rôle qui peut engager (FR-196).
- **« Lancer la navette »** crée un **bon de transfert** dans `stock` : une sortie au site source et une entrée en transit au site destinataire (FR-199). Avec `entrepot` installé, la préparation, le chargement et la réception du transfert s'y exécutent ; sans lui, la réception se confirme dans `stock`.
**Conséquences (testables) :** (1) un site à 20 jours de couverture ne cède rien ; (2) lancer une navette de 300 unités fait baisser de 300 le stock du site source et fait apparaître 300 unités en transit, puis disponibles à la réception ; (3) annuler une navette avant la sortie ne crée aucun mouvement ; après, elle crée un retour ; (4) une proposition de 260 000 FCFA ne part jamais seule ; (5) le bouton reste « bientôt » tant qu'il n'écrit pas de mouvement : il ne simule jamais.

#### FR-246 : Le plan de liquidation et « Lancer le scénario »
La démo compare cinq sorties pour un article en perte, mais « Lancer le scénario » ne crée ni promotion, ni transfert, ni retour (`PlanLiquidationPanel.tsx:153-166`). Règles, pour un article dont la gravité est `HAUTE` ou `CRITIQUE` (FR-244) :
- Cinq scénarios : `REMISE`, `COMBO`, `TRANSFERT`, `RETOUR_FOURNISSEUR`, `REBUT`. Le plan recommande le scénario faisable au plus grand **gain face à l'inaction** = recette nette + coût de l'inaction × (unités écoulées ÷ stock). Le capital déjà dépensé est exclu de la comparaison.
- **Coût de l'inaction** : article périssable = unités invendables avant la date limite × coût ; sinon portage (stock × coût × 22 %) + décote finale (40 % si `OBSOLETE`, 15 % sinon).
- `REMISE` : décotes essayées 10, 15, 20, 25, 30, 40 et 50 % ; vitesse = vitesse × (1 + décote × élasticité) ; horizon de 90 jours ; on garde la décote de plus grande recette nette ; frein signalé si l'élasticité est inférieure à 1,3.
- `COMBO` : porteur de même catégorie, au même site, de plus forte vitesse ; vitesse du combo = 0,35 × vitesse du porteur ; remise de 40 % (obsolète), 20 % (date limite courte), 15 % sinon ; horizon de 90 jours.
- `TRANSFERT` : coût et délai de FR-245. `RETOUR_FOURNISSEUR` : seulement si une clause de reprise existe ; recette = stock × coût × taux de reprise ; délai de 15 jours. `REBUT` : recette nulle, délai de 3 jours, le portage s'arrête.
- **« Lancer le scénario »** crée l'objet du scénario retenu, par le contrat du module qui le possède : une promotion ou un combo à valider (`marketing`, FR-144 ; `catalogue` pour la remise), un bon de transfert (`stock`, FR-245), une demande de retour fournisseur (`approvisionnement`), un ajustement de stock avec motif (`stock`, FR-S16).
**Conséquences (testables) :** (1) sur un article obsolète du jeu de test, le plan affiche les cinq scénarios avec leur gain et recommande le plus grand ; (2) un retour fournisseur sans clause de reprise est marqué « non faisable » ; (3) lancer un scénario `COMBO` crée un combo en attente de validation chez `marketing`, visible dans sa file ; (4) sans le module visé, le scénario affiche « non installé » et ne se lance pas ; (5) un scénario lancé deux fois ne crée qu'un objet (idempotence).

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : emplacements, contraintes, capacités (FR-S02 à FR-S04) ; stock négatif (FR-S09) ; stock à une date passée (FR-S10) ; mouvement idempotent et ajustement avec motif et seuil de validation (FR-S14 à FR-S16) ; lots, FEFO, échéances (FR-S17 à FR-S22) ; valorisation et clôture d'exercice (FR-S23 à FR-S34) ; relevé du commercial contre estimation déduite (FR-S56 à FR-S60) ; droit de valorisation (FR-S61, FR-S62) ; audit (FR-S65). **Tous ces écrans sont voulus** (décision du PO du 2026-11-12 : « pour le moment je veux les voir tous ; en fonction de l'évolution on va voir »).

---

### 7.5 ★ Paiement (`paiement`, M33) — PRD `prd-paiement-service-2026-08-02` + amendement 2026-09-21

**Ce que la démo montre et que le PRD couvre.** Créance et demande (FR-P13, FR-P13b ; la Créance du distributeur est précisée par FR-247) ; paiement partiel (FR-P25, FR-P26 ; `ComptabiliteComptableView.tsx:43`) ; promesse de paiement (FR-P28 à FR-P30 ; `RelancesView.tsx:509,607,647`) ; encaissement déclaré hors Prospera, espèces (FR-P31 à FR-P36 ; `ClotureVisiteModal.tsx:84`, `ExpeditionPanel.tsx:160-162`) ; rapprochement avec la remise d'espèces (FR-P33 ; `ComptabiliteComptableView.tsx:280-307`) ; lettrage et suspens (FR-P37 à FR-P39) ; ordres de paiement, c'est-à-dire le « run de paiement » du DAF (FR-P65 à FR-P69 ; `DashboardFinance.tsx:22-35`). Le manifeste `paiement` : `depends: []`, `enrichiPar: [notification, facturation]`, sept droits `paiement:*`, `objetsDeReprise: []`, domaine d'échange `paiement.encaissements`.

**Écarts à porter au PRD du module.**

#### FR-205 : Deux adaptateurs de paiement, PI-SPI et FedaPay ; FR-P10 est à mettre à jour
Décision du PO (2026-11-12) : les moyens de paiement du distributeur sont **PI-SPI et FedaPay**, plus espèces et virement déclarés. Le code livre déjà les deux derrière le contrat `PaymentProvider` : `src/adapters/api-business/` (identifiant `API_BUSINESS`, ordres sortants, relevé, QR interopérable) et `src/adapters/fedapay/` (cinq pays de la zone XOF, signature des notifications), avec routage par pays × devise × méthode (FR-P08). Le PRD est en retard : FR-P10 dit « FedaPay en développement ; le SPI BCEAO ou tout autre fournisseur est une configuration ». À amender : FR-P10 énonce « deux fournisseurs en service, PI-SPI (`API_BUSINESS`) et FedaPay (`fedapay`) » ; l'amendement du 2026-09-21 (FR-P65 à FR-P69) ajoute les ordres sortants sur le schéma interopérable. Le module s'appelle **`paiement`** : PI-SPI est un moyen de paiement, non un module ; le code `pi-spi` du catalogue est à déprécier.
**Conséquences (testables) :** (1) le routage d'une demande de 50 000 FCFA vers un payeur togolais retourne le fournisseur choisi par la configuration de l'organisation, et le journal le nomme ; (2) désactiver FedaPay dans la configuration de l'organisation laisse PI-SPI actif et inversement, sans déploiement ; (3) aucun écran du distributeur ne porte le mot « module PI-SPI » : le libellé est « Encaissements » ; (4) le manifeste `connecteurs` ne cite plus `pi-spi` (voir FR-218).

#### FR-206 : Le vocabulaire « Mobile Money » est corrigé
La démo ne cite ni PI-SPI ni FedaPay (aucune occurrence dans `src/` ni `docs/`). Elle dit « Mobile Money » (`MOBILE_MONEY`, `ESPECES`, `VIREMENT`, `ComptabiliteComptableView.tsx:25-34`), cite `TMONEY` et `FLOOZ` en références brutes (`comptable-registry.ts:35,48`) et promet dans sa documentation commerciale MTN MoMo, Airtel Money, M-Pesa, Orange Money et Wave (`prospera_annexe_distribution.md:163`), alors que pour le Togo T-Money et Flooz sont les seuls réels, et que ni FedaPay ni le schéma interopérable ne se pilotent par opérateur. Ce PRD exige : le **mode d'encaissement** d'une pièce prend ses valeurs dans `paiement` (`LIEN`, `ESPECES`, `VIREMENT`, `CHEQUE` ; le chèque est un moyen déclarable du PRD `paiement`, FR-P31, que la démo rangeait sous espèces ou virement) et le **fournisseur** est un champ distinct (`API_BUSINESS`, `fedapay`, ou `HORS_PROSPERA`) ; l'opérateur mobile n'est qu'une information du relevé du fournisseur.
**Conséquences (testables) :** (1) aucun écran ni aucun gabarit commercial n'affiche « MTN MoMo », « Airtel Money », « M-Pesa », « Orange Money » ni « Wave » pour une organisation togolaise (balayage des libellés) ; (2) un encaissement T-Money et un encaissement Flooz portent le même mode `LIEN` et deux opérateurs en information ; (3) le libellé « Mobile Money » est remplacé par « Paiement mobile » ou le mode précis.

#### FR-207 : L'écran du lien de paiement est à créer
Le « lien Mobile Money » envoyé avec la facture ou la relance (`prospera_annexe_distribution.md:152,165`, `prospera_distribution.md:202`) est le lien de paiement des FR-P14 à FR-P18 ; la démo n'a aucun écran. À créer : émission d'un lien depuis une facture ou un dossier de relance (montant, motif, frais affichés, durée de validité par défaut 30 jours, plafond 90 jours), partage par `notification` (WhatsApp, SMS, e-mail), suivi de l'état (émis, consulté, payé, expiré, révoqué), révocation avant paiement. La page publique du lien est consultable sans compte, sur téléphone modeste (NFR-8).
**Conséquences (testables) :** (1) depuis une facture de 120 000 FCFA, « Envoyer un lien » crée une demande, la transmet par `notification` et affiche l'état « émis » ; (2) payer le lien (bac à sable) marque l'encaissement constaté et réduit le solde de la facture sans action humaine ; (3) un lien expiré ou révoqué n'encaisse plus et le dit au payeur ; (4) en espace d'essai, aucun lien réel ni aucun message réel ne part (C13, point 6).

#### FR-208 : Les frais d'encaissement sont une politique du créancier, à montrer
La démo n'a aucune notion de frais (FR-P23, FR-P23b, FR-P23c, FR-P24b). Le distributeur est le créancier : il choisit qui supporte les frais (`payeur` par défaut, ou `bénéficiaire`, ou partage), figés à l'émission de la demande. L'écran de lien affiche montant dû, frais et total au payeur ; l'écran de paramètres du distributeur porte la politique.
**Conséquences (testables) :** (1) avec la politique `payeur`, un lien de 100 000 FCFA affiche montant dû, frais et total, et le total encaissé couvre les frais ; (2) changer la politique après émission ne modifie pas un lien déjà émis ; (3) le montant imputé à la facture est le montant dû, jamais le total frais compris.

#### FR-209 : Le « fichier banque » du run DAF est remplacé par des ordres de paiement
La démo parle d'un fichier banque et d'un export, « générer les ordres de virement » (`AUDIT:200,203`, `DashboardFinance.tsx:22`, `PilotageDAFView.tsx:15`). Un fichier téléversé à la banque ne passe pas par le fournisseur de paiement. L'amendement FR-P65 à FR-P69 prévoit des ordres **préparés** et **validés** par deux droits distincts et deux personnes, transmis par le fournisseur, dont l'issue vient du fournisseur et non d'une supposition (FR-P68). Décision confirmée par le PRD `paiement` (FR-P65 à FR-P69, validé par le PO le 2026-09-21) : les ordres de paiement sont le mécanisme ; le fichier banque reste « bientôt ». Décision du PO du 2026-11-12 : les ordres de paiement aux fournisseurs sont **exigés** (préparation, validation à deux personnes, transmission) ; la transmission réelle part dès que le raccordement de l'organisation chez le fournisseur est fait. Jusque-là, un ordre validé attend à l'état « en attente de raccordement », visible, jamais présenté comme payé. Les ordres se préparent et se valident dans l'écran « Ordres de paiement » de `paiement` ; le run du DAF de `finance-transactions` (hors février, décision du PO du 2026-11-12) n'en sera que la vue de pilotage.
**Conséquences (testables) :** (1) préparer un ordre et le valider sont deux droits distincts, et la même personne ne peut pas faire les deux (FR-P66) ; (2) un ordre rejeté par le fournisseur est terminal et un nouvel ordre se prépare (FR-P68) ; (3) l'écran des ordres affiche l'état du fournisseur, non un état présumé ; (4) le bouton « Générer le fichier banque » affiche `bientôt` ; (5) sans raccordement, un ordre validé reste « en attente de raccordement » et la dette fournisseur reste ouverte ; (6) en espace d'essai, aucun ordre réel ne part (C13, point 6).

#### FR-210 : Les modes et conditions de règlement d'une pièce sont séparés
Les modes de la démo `ESPECES`, `VIREMENT`, `CHEQUE`, `CREDIT_30J`, `CREDIT_45J`, `CREDIT_60J` (`types/index.ts:101`) mélangent des moyens d'encaissement et des conditions de crédit. Le PRD `paiement` ne traite que l'encaissement (FR-P31). Séparation : la **condition de règlement** (comptant, 30 j, 45 j, 60 j) appartient à `pdv` (FR-188) et `facturation` ; le **mode d'encaissement** (lien, espèces, virement, chèque) appartient à `paiement`.
**Conséquences (testables) :** (1) une facture « 45 jours » encaissée en espèces porte les deux : échéance à 45 jours et mode `ESPECES` ; (2) `paiement` ne contient aucun champ de condition de crédit (test de schéma) ; (3) les valeurs `CREDIT_30J`, `CREDIT_45J`, `CREDIT_60J` ne sont plus des modes d'encaissement.

#### FR-247 : La Créance est un registre unique tenu par `paiement`
Décision du PO du 2026-11-12 : la Créance a **un seul propriétaire**, `paiement`. `facturation` publie ses faits (facture émise, avoir émis, facture reprise) ; `paiement` ouvre la Créance et la réduit en les consommant ; `recouvrement` la lit. `facturation` ne possède aucune créance et ne tient aucun solde : le reste dû d'une facture, la balance clients et la balance âgée sont servis par `paiement` (contrat de lecture `paiement.creance@1`). `facturation` dépend en dur de `paiement` (annexe A.2).
Amendement du PRD `paiement` (FR-P13), à écrire avant la validation du lot. La Créance y reçoit :
- **un tiers** : celui qui doit (point de vente, freelance envers la société, membre d'une IMF, assuré) ;
- **une source** : ce qui l'a ouverte (`FACTURE` pour le distributeur ; `ECHEANCE_DE_PRET` et `PRIME` sont réservées aux verticales microfinance et assurance) ;
- **un périmètre** : l'organisation, ou l'espace propre d'un freelance pour les créances sur ses détaillants, invisible de la société (FR-C29) ;
- **des composantes** : principal seul pour le distributeur ; principal, intérêt, pénalité et frais prévus pour les autres verticales (§6.0).
Faits publiés : `paiement.creance.materialisee` (ouverture), `paiement.creance.changed@1` (reste dû, échéance, ancienneté), `paiement.creance.soldee`, `paiement.creance.cloturee`.
**Conséquences (testables) :** (1) une facture de 507 400 FCFA émise ouvre en moins de 5 secondes une Créance de 507 400 FCFA ; un encaissement de 200 000 FCFA la ramène à 307 400 FCFA, et la facture, le dossier de recouvrement et la balance âgée affichent 307 400 FCFA (ils lisent le même registre) ; aucun test n'exige « le même instant » entre deux services ; (2) `facturation` ne contient aucun champ de reste dû, de montant encaissé ni de statut payé (test de schéma) ; (3) les totaux de la balance clients, de la balance âgée et du recouvrement sortent de la même requête sur `paiement.creance@1` ; (4) un avoir émis réduit la Créance de son montant ; (5) une créance du périmètre d'un freelance n'apparaît dans aucune balance de la société.

#### FR-248 : L'argent reçu sans créance devient un crédit du tiers
La démo refuse un paiement supérieur au reste dû. Or un paiement déjà reçu chez PI-SPI ou FedaPay ne peut pas être refusé : l'argent est là. Décision de ce PRD : un encaissement qui n'a pas (encore) de créance devient un **crédit du tiers**, tenu par `paiement` : avance, acompte, trop-perçu. Un avoir sur une facture déjà payée crée aussi un crédit du tiers. Le crédit est **imputé** ensuite : sur la créance désignée d'abord, sinon sur la créance échue la plus ancienne. Il peut aussi être remboursé, par un ordre de paiement (FR-209). Le crédit du tiers réduit l'encours (FR-187).
Fait publié : `paiement.credit-tiers.changed@1` (solde, origine, imputations).
**Conséquences (testables) :** (1) un paiement par lien de 520 000 FCFA sur une créance de 507 400 FCFA solde la créance et crée un crédit du tiers de 12 600 FCFA ; rien n'est refusé ; (2) à la facture suivante de ce client, sa créance est réduite de 12 600 FCFA par l'imputation (la facture garde son montant), et le journal le dit ; (3) un acompte de 100 000 FCFA reçu avant toute facture est un crédit du tiers, imputé sur la première facture du client ; (4) seul un encaissement **déclaré** (espèces, virement) par un utilisateur peut être refusé au-dessus du reste dû, avec `PAIEMENT_SUPERIEUR_AU_RESTE_DU` ; (5) le rembourser exige deux personnes, comme tout ordre de paiement.

**Ce que le PRD exige et que la démo ne montre pas.** Écrans à créer : comptes d'encaissement (FR-P01 à FR-P06) ; webhook, idempotence, états (FR-P19 à FR-P22) ; délai de 48 heures ouvrées (FR-P34) ; import du relevé fournisseur (FR-P38) ; annulation constatée (FR-P49 à FR-P53) ; pays et devises (FR-P54 à FR-P58) ; journal opposable (NFR-4) ; registre des créances et crédits du tiers (FR-247, FR-248). Les droits d'abonnement et de suspension pour impayé (FR-P42 à FR-P48) n'ont pas d'objet côté distributeur. Pour février, décision du PO du 2026-11-12 : compte d'encaissement, lien de paiement (PI-SPI et FedaPay), frais, encaissement déclaré (espèces, virement), rapprochement et lettrage, remises d'espèces, registre des créances et crédit du tiers sont exigés ; les ordres de paiement aux fournisseurs sont exigés, et leur transmission réelle part dès que le raccordement de l'organisation est fait (FR-209).

---

### 7.6 Notification (`notification`, M34) — PRD `prd-notification-service-2026-08-02`

**Ce que la démo montre et que le PRD couvre.** Canaux e-mail, SMS, WhatsApp (FR-N18) et repli « WhatsApp sinon SMS » (FR-N21 ; `RelancesView.tsx:40-45`) ; liste et envoi de masse (FR-N28, FR-N29 ; `MarketingView.tsx:61,160,382`) ; plafond d'envois (FR-N33 ; `garde-fous.ts:95-99`) ; envoi déclenché par événement et arrêt à l'encaissement (FR-N24 ; `recouvrement-automations.ts:356-367`) ; statuts et réponses (FR-N35 à FR-N39, FR-N41). Le manifeste `notification` : `depends: []`, `enrichiPar: []`, six droits, `objetsDeReprise: []`.

**Écarts à porter au PRD du module.**

#### FR-211 : Un client en défaut ou au crédit bloqué est exclu des campagnes ; la règle est de `marketing`
La démo exclut des campagnes un client en défaut ou au crédit bloqué (`garde-fous.ts:43-70`, `SEUIL_EXCLUSION_JOURS`). Le PRD notification gère le consentement et le désabonnement (FR-N46 à FR-N50), non la solvabilité, et il ne connaît aucune donnée métier (FR-N05). La règle est donc posée ici, appliquée par **`marketing`** à la constitution de l'audience : exclusion si la créance la plus ancienne dépasse `SEUIL_EXCLUSION_JOURS` (paramètre du distributeur, publié par `recouvrement`) ou si le crédit est bloqué (FR-189). `notification` n'en reçoit que la liste finale. Les messages transactionnels (relance, facture, lien de paiement) ne sont **pas** concernés : le refus de la publicité n'éteint pas une mise en demeure (FR-N26, FR-N50), et l'inverse vaut (un client en défaut reçoit sa relance).
**Conséquences (testables) :** (1) sur le jeu de test, avec `SEUIL_EXCLUSION_JOURS` à 30 jours (défaut), un client dont la créance la plus ancienne est échue depuis 35 jours est retiré d'une campagne promotionnelle et reste destinataire de sa relance ; (2) la fiche de campagne affiche le nombre de clients exclus et le motif, sans nommer ; (3) sans `recouvrement` et sans `facturation`, l'exclusion est « non évaluée » et la validation d'un envoi de masse demande une confirmation explicite plutôt que d'envoyer à tous en silence ; (4) un client exclu n'apparaît jamais dans la liste remise à `notification` (le test lit la liste, non l'écran).

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

#### FR-249 : La facture et la relance partent par WhatsApp dès février, avec repli SMS
Les deux parcours n° 1 envoient la facture et la relance par WhatsApp (UJ-1). Le module `notification` existe : cet envoi est **exigé**, jamais « bientôt ». Les modèles « envoi de facture » (PDF et lien de paiement, FR-207) et « relance » sont soumis à l'approbation WhatsApp avant la mise en service (FR-N11) ; hors de la fenêtre de 24 heures, seul un modèle approuvé part. Si WhatsApp échoue ou si le modèle n'est pas approuvé, le message part par SMS (FR-N21), puis par e-mail.
Décision du PO du 2026-11-12 : la conservation des messages WhatsApp des clients et leur consentement suivent le PRD notification (§9.2), sans règle propre au distributeur.
**Conséquences (testables) :** (1) émettre une facture et cliquer « Envoyer au client » produit un message WhatsApp avec le PDF et le lien de paiement, et son accusé au journal ; (2) un numéro sans WhatsApp reçoit un SMS avec le lien ; (3) un modèle non approuvé n'est jamais choisi ; le repli SMS part et le journal le dit ; (4) le lien vers le PDF expire et chaque ouverture est journalisée ; (5) en espace d'essai, l'envoi est intercepté et compté (C13, point 6).

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
| Factures impayées à la bascule | `facturation` (le document), puis `paiement` (la Créance) | `facturation.facture-ouverte@1` | **Proposé** : objet à déclarer au manifeste `facturation` (partie 2). `facturation` reprend la facture ; `paiement` ouvre sa Créance au reste dû repris en consommant le fait de reprise (FR-247). `paiement` n'a donc pas d'objet de reprise propre |
| Suite de numérotation des factures de Sage | `facturation` | `facturation.suite-numerotation@1` | **Proposé** (voir FR-217) |
| Fournisseurs | `approvisionnement` | `approvisionnement.fournisseur@1` | **Proposé** ; `approvisionnement` figure dans `reprise.enrichiPar` (PR #420) ; module non codé, « non installé » s'il manque en février |
| Historique des ventes et des paiements | aucune | aucun | **Non repris en février** : la reprise demandée par le PO ne le cite pas (brain dump, §2). Les graphiques « Évolution CA 6 mois » (`PdvRapportView.tsx:134`) partent de la mise en service et le disent (« historique depuis le JJ/MM »), jamais un 0 |

**Conséquences (testables) :** (1) chaque ligne « Prêt » est rejouable sur le jeu de test avec valeur de contrôle égale ; (2) la Reprise livre dans l'ordre : `reseau`, puis `pdv` et `catalogue`, puis `stock` ; `facturation` en dernier, car une facture ouverte référence un client et un article ; `paiement` ouvre les Créances à la suite ; (3) une cible absente donne un écart « module non installé » au rapport, pas une erreur ; (4) la balance clients du premier jour, lue dans `paiement`, est égale, à l'unité de FCFA, à la somme des factures impayées du fichier Sage (valeur de contrôle « reste dû ») ; (5) une facture reprise sans Créance ouverte dans les 5 secondes est un écart au rapport, et le feu vert de `facturation` reste refusé.

#### FR-217 : La suite de numérotation des factures de Sage reprend sans trou ni doublon
Aucune occurrence de « numérotation » ni de « suite de numéros » dans la spine de la Reprise, le PRD reprise ni les manifestes. Dans la démo les numéros sont `FAC-2026-8821` (`factures-registry.ts:40`) : une suite par année. Exigence nouvelle : le **dernier numéro émis sous Sage** est repris comme valeur de départ du compteur de `facturation` (par série : facture, avoir, proforma) ; la première facture Prospera porte le suivant ; **aucun trou et aucun doublon**, y compris sous deux saisies simultanées. Le compteur appartient au seul module `facturation` (point d'écriture unique), et le lot de reprise est le seul à pouvoir l'initialiser, une fois.
**Conséquences (testables) :** (1) reprise du dernier numéro `FAC-2026-8821` : la première facture émise s'appelle `FAC-2026-8822` ; (2) 50 factures émises en parallèle reçoivent 50 numéros consécutifs distincts ; (3) une annulation ne libère pas son numéro, elle émet un avoir ; (4) réimporter une seconde suite de numérotation après la première facture Prospera est refusé avec un code nommé ; (5) le format du numéro est un paramètre (préfixe, année, largeur), repris du fichier Sage, non du code ; (6) la suite s'initialise au **gel de Sage** : à partir de l'heure de bascule, plus aucune facture ne s'émet dans Sage, même pendant la marche en parallèle (Reprise FR-17) ; un numéro Sage postérieur au gel, trouvé au rapport, bloque le feu vert de `facturation`.
Le format exact des numéros Sage du client de février n'est pas encore connu : les exports Sage ne sont pas encore fournis (brain dump du PO, §4). Il est obtenu avec l'export des factures ouvertes.

**Ce que le PRD exige et que la démo ne montre pas.** Tout le reste est à créer : provenance de chaque donnée (Reprise FR-2) ; fichiers (Reprise FR-3) ; états valides (Reprise FR-5) ; dates d'origine (Reprise FR-6) ; montants à saisir (Reprise FR-7) ; doublons (Reprise FR-12) ; droit de valider attribué par le DG seul (Reprise FR-13) ; livraison (Reprise FR-14) ; écart nul et feu vert par module (Reprise FR-15) ; marche en parallèle (Reprise FR-17) ; Reprise FR-21 et Reprise FR-22. L'historique des ventes (partie « historique protégé » de Reprise FR-9) n'est pas repris en février (FR-216).

---

### 7.8 Connecteurs (`connecteurs`, M43) — PRD `prd-connecteurs-2026-11-10`

**Ce que la démo montre et que le PRD couvre.** Rien à l'écran. La démo ne montre aucune frontière entre ce que Prospera possède et ce que le logiciel du client possède ; seul le texte « Intégration Odoo » existe (`prospera_pricing_distribution.md:27`), sans écran. Le PRD Connecteurs (Connecteurs FR-14 : distributeur et Odoo) fixe un propriétaire par domaine : points de vente, visites, commandes terrain = Prospera ; encaissements terrain (Mobile Money, espèces) = Prospera ; produits et prix, stock, créances ouvertes, fournisseurs = Odoo si le client le garde ; commerciaux = Prospera. Le manifeste `connecteurs` : `depends: []`, `enrichiPar: [reprise, pdv, catalogue, stock, facturation, paiement, approvisionnement]` (`pi-spi` remplacé par `paiement`, PR #420), quatre droits `connecteurs:*`, `domainesEchange: []`. Pour le client de février, qui quitte Sage, aucun domaine n'a de logiciel externe propriétaire (FR-219).

**Écarts à porter au PRD du module.**

#### FR-218 : Connecteurs est hors février ; l'export vers Sage vient après
Amendement du 2026-11-12 (spine de Connecteurs, AD-32) : Connecteurs est hors février. Décision du PO, même jour : l'export vers Sage se fera **après** février ; pour février, le projet est démontrable avec de vraies données de test et des parcours concrets. Conséquences pour ce PRD : aucun bouton de la démo ne promet une intégration ; « Intégration Odoo », « Export Sage » et « Télédéclarer sur le portail OTR » affichent `bientôt` ; les modules de la partie 2 déclarent leurs `domainesEchange` dès le manifeste (facturation, encaissements) pour que le passage futur ne les oblige pas à une reprise de code (règle du point d'écriture unique par domaine, contrat §6). Le manifeste `connecteurs` citait `pi-spi` dans `enrichiPar` : le module s'appelle `paiement` (FR-205) ; la ligne est corrigée (PR #420).
**Conséquences (testables) :** (1) aucun écran du distributeur ne déclenche un échange avec un logiciel externe en février ; (2) la section « Intégrations » du menu n'apparaît que si `connecteurs` est installé ; (3) un domaine d'échange déclaré (par exemple `facturation.factures`) a une seule fonction d'écriture de service, vérifiée par la suite de conformité ; (4) `connecteurs.enrichiPar` ne contient plus `pi-spi`.

#### FR-219 : Le logiciel quitté est Sage ; le document tarifaire est à corriger
Décision du PO : le client de février **quitte Sage**. Le brain dump du PO et le PRD Reprise le disent. La documentation commerciale classait le même client « Odoo complet » (`prospera_pricing_distribution.md:16`) : ce document est faux sur ce point et **est à corriger**. Ce n'est plus une question. Conséquence : aucun connecteur Odoo en février (déjà acté par AD-32), et une reprise par fichiers au gabarit Sage (Connecteurs FR-1). La ligne « distributeur et Odoo » de Connecteurs FR-14 reste valable pour un futur client qui garde Odoo ; elle ne concerne pas le client de février.
**Conséquences (testables) :** (1) le gabarit de reprise livré en février est celui de Sage ; (2) aucun test de recette ne suppose Odoo ; (3) le document tarifaire ne classe plus le client de février « Odoo complet » (correction tracée dans le dépôt de la démo) ; (4) « Intégration Odoo » reste un bouton « bientôt », sans date.

**Ce que le PRD exige et que la démo ne montre pas.** Tous les écrans de Connecteurs sont à créer et sont hors février : configuration du logiciel du client (4.A), échanges et file des écarts (4.B, 4.C), panne du lien (4.D), ordre de livraison du connecteur Odoo (4.F). Un seul écran est utile dès que le premier domaine existera : l'état **« lecture seule, propriété du logiciel externe »**, qui bloque l'édition d'un objet dont le client a gardé la propriété (enveloppe `<ProtectionObjet>`) ; la démo ne le prévoit pas, et ce PRD l'inscrit pour le module d'écran de chaque domaine d'échange.

---

### 7.9 Décisions de la partie 4

Toutes les questions de la partie 4 sont tranchées. Il ne reste qu'une donnée à obtenir du client.

| # | Sujet | Décision | Lien |
|---|---|---|---|
| OQ-4-1 | Sage ou Odoo ? | Sage : le client quitte Sage ; le document tarifaire est à corriger (décision du PO). | FR-219 |
| OQ-4-2 | Qui produit le score de santé le premier jour ? | Une règle de `dashboard`, déposée dans `pdv` avec sa provenance (décision du PO du 2026-11-12). | FR-184 |
| OQ-4-3 | Fichier banque ou ordres `paiement` ? | Ordres de paiement `paiement`, exigés (PRD paiement validé par le PO le 2026-09-21 ; décision du PO du 2026-11-12) ; transmission réelle dès le raccordement ; le fichier banque reste « bientôt », sans date. | FR-209 |
| OQ-4-4 | `montant_client` exposé au DG ? | Sans objet : quelle que soit la démo, l'API ne le rend jamais à la société (FR-C29). | FR-195 |
| OQ-4-5 | Qui reçoit l'historique des ventes et des paiements ? | Personne en février : il n'est pas repris (la reprise demandée par le PO ne le cite pas). | FR-216 |
| OQ-4-6 | Écrans de `reseau`, `pdv`, `catalogue`, `stock` réduits pour février ? | Non : tous les écrans sont voulus ; on ajustera selon l'évolution (PO, 2026-11-12). | 7.1 à 7.4 |
| OQ-4-7 | Format des numéros Sage et dernier numéro émis | Donnée à obtenir avec l'export des factures ouvertes (action du PO auprès du client). | FR-217 |

---

---


<!-- COUPURE-ANNEXES : ne pas supprimer ; ici s’insèrent §8 à §13 -->

## Annexe A. Contrat de module (13 lignes par module)

Le contrat `CONTRAT-DE-MODULE-2026-11-09.md` (§6) demande à chaque PRD une section de **treize lignes**, une par clause C1 à C13. Cette annexe la donne pour les seize modules des parties 2 et 3, puis renvoie aux manifestes des huit modules de la partie 4. Règles de lecture :

- **Une ligne vide fait échouer le contrôle de préparation** (`bmad-check-implementation-readiness`). Aucune cellule n'est donc vide : une clause « sans objet » dit pourquoi. **C11 « sans objet »** dit pourquoi le module n'a pas d'IA ; **C12 et C13** ne sont jamais « sans objet » sans raison écrite.
- Les noms de codes, de droits, de topics, de modèles et de finalités IA sont des **propositions** sauf mention contraire, modifiables avant le manifeste. Les noms de modèles et de finalités viennent de l'offre des cahiers des charges de la démo (`docs/CAHIER_DES_CHARGES_BUNDLE_*.md`, `docs/BUDGET_CHARGES_PROSPERA.md`). `[À CONFIRMER]` reprend une mention de `manifestes-a-produire.md`, à lever au moment d'écrire le manifeste. Les modules ★ sont `commande`, `facturation`, `terrain` et `recouvrement` dans cette annexe, plus `pdv`, `catalogue`, `stock` et `paiement` en A.17.
- Conventions communes, vraies pour chaque module sauf mention contraire. **Gate** : refus `<CODE>_NOT_ENTITLED` (code en majuscules, tiret remplacé par `_`), 403 sans donnée, lecture de l'état publié seul (C2, amendements). **Cloisonnement** : `organisationId` sur chaque lecture et écriture (graphie des nouveaux contrats, C5) et, pour les modules à périmètre, la portée lue dans `reseau.portee.changed@1`. **Profil** : `profiles: ["<code>"]` au compose (C10). **Version** : `1.0.0`. **Routes C13** : `GET|POST /api/v1/instance/<code>/{organisationId}/{export|import|effacement|sante}` et `verifications/<code>` (tableau du contrat, amendement du 2026-11-11). **Lecture seule** : `GET`, `HEAD`, `OPTIONS` plus l'export ; toute écriture rend 403 `ABONNEMENT_EXPIRE`. **Essai** : toute sortie réelle est interceptée et comptée, l'écriture réelle rend `ECRITURE_REELLE_DEPUIS_ESSAI`. **Export** : CSV et JSON par organisation, réservé à `instance:donnees:exporter`. **Effacement** : tracé, avec certificat. **Données** : le module écrit seul ses collections ; il lit les autres par leurs faits (C3).
- **Format des droits.** Le contrôle visé est `^[a-z]+:[a-z-]+:[a-z]+$` (module en lettres seules, objet avec tiret admis, action en lettres seules). **Cinq codes de module de cette annexe ont un tiret : `conquete-objectifs`, `studio-social`, `controle-gestion`, `finance-transactions`, `support-client`.** Ils ne passent pas le format de droit actuel d'`auth-service` (`TENANT_PERMISSION_FORMAT`). L'amendement C7 du 2026-11-11 prévoit l'élargissement (`^[a-z-]+:[a-z-]+:[a-z]+$`), dont la story `auth-service` se livre **avant la semaine 5** ; ces cinq modules ne peuvent pas être installés avant elle. D'ici là leurs droits sont écrits dans la forme élargie. Le catalogue des droits est aussi un `enum` fermé de 13 codes (C7) : chaque droit ci-dessous demande une PR `auth-service` à la livraison du module.
- **Dépendances.** `depends` bloque l'installation, `enrichiPar` ne bloque jamais (contrat §3) ; aucun cycle (`MANIFESTE_CYCLE`). Le graphe : `reseau` ← `pdv` ← {`commande`, `facturation`, `conquete-objectifs`, `freelance`, `marketing`, `support-client`} ; `catalogue` ← {`commande`, `facturation`, `freelance`, `approvisionnement`} ; `stock` ← {`approvisionnement`, `entrepot`} ; `commande` ← `entrepot` ; `paiement` ← {`facturation`, `recouvrement`, `finance-transactions`} ; `notification` ← {`recouvrement`, `marketing`}. Aucun module n'en dépend en retour (les retours passent par `enrichiPar`). Ces dépendances dures sont **validées par le PO le 2026-11-12** : `commande` et `facturation` vers `catalogue` et `pdv` ; `facturation` vers `paiement` (la Créance, FR-247) ; `approvisionnement` vers `stock` et `catalogue` ; `entrepot` vers `stock` et `commande` ; `freelance` vers `catalogue` et `pdv`. Conséquence : une commande exige un point de vente ; la vente au comptoir passe par le « client comptoir » générique de chaque point de stock (FR-241).
- **Vérifications** : chacune a une route, un résultat 🟢, 🟠 ou 🔴 et un critère chiffré.

### A.1 ★ Commande (`commande`, M08)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'commande'`, `version: '1.0.0'`. `depends: [{catalogue, "Une ligne de commande vise un article et un prix résolu par la grille."}, {pdv, "Une commande appartient à un point de vente et lit son plafond et ses conditions de règlement."}]` (validées par le PO le 2026-11-12 ; vente au comptoir sur le client comptoir de son point de stock, FR-241). `enrichiPar: [stock (disponible et réservation), facturation (facture en un clic), paiement (encours, crédit du tiers, encaissement au comptant), terrain (commande saisie en tournée), entrepot (bon de livraison préparé), recouvrement (crédit bloqué)]`. |
| C2 Socle | Gate `COMMANDE_NOT_ENTITLED`. Cloisonnement par `organisationId` et par portée (zone, portefeuille) : un commercial ne lit que ses commandes, un freelance que les siennes (FR-C30), un superviseur sa zone. Service porteur : `commande-service` [À CONFIRMER, M08]. |
| C3 Données possédées | Commandes, lignes, états (brouillon, validée, préparée, livrée, annulée), demandes de remise et leur décision, bons de livraison émis, journal d'états. Lues seulement : articles et prix (`catalogue`), plafond et conditions (`pdv`), disponible (`stock`). |
| C4 Emplacements vides | `stock` absent : disponible et réservation = `{etat: NON_INSTALLE, module: stock}` ; la validation est **refusée** avec `STOCK_NON_INSTALLE` (FR-32) ; le brouillon reste saisissable ; `facturation` absent : « Transformer en facture » = `NON_INSTALLE` ; `paiement` absent : encours et disponible à crédit = `NON_INSTALLE`, la commande à crédit est refusée (garde-fou financier non vérifiable : refus par défaut) ; `recouvrement` absent : crédit bloqué = `NON_INSTALLE` ; `entrepot` absent : statut de préparation = `NON_INSTALLE`. Un test par dépendance de `enrichiPar`. |
| C5 Contrats nommés | Publie `commande.commande.validee@1`, `commande.commande.annulee@1`, `commande.commande.changed@1`, `commande.remise.decidee@1`, `commande.bon-livraison.emis@1`, `commande.bon-livraison.livre@1` (quantités livrées confirmées, d'où naît la facture). Consomme `catalogue.grille.publiee@1`, `catalogue.article.changed@1`, `pdv.plafond.changed@1`, `pdv.point-de-vente.changed@1`, `stock.disponible.changed@1`, `entrepot.preparation.terminee@1`, `entrepot.expedition.livree@1`, `paiement.creance.changed@1` et `paiement.credit-tiers.changed@1` (encours, FR-187), `etat-publie.changed.reel@1` et `.essai@1`. |
| C6 Paramètres | Refus au dépassement du plafond ou au crédit bloqué (jamais un simple avertissement, FR-187) ; seuil de remise exigeant une validation (12 % dans la démo, `combo-stock-workflow.ts:7`) ; délai d'alerte d'une réservation sous crédit bloqué (7 jours, FR-203) ; états configurables du cycle ; remise maximale ; référentiel de motifs d'annulation. Données, jamais code. |
| C7 Droits | `commande:commande:saisir`, `commande:commande:valider`, `commande:commande:annuler`, `commande:portefeuille:consulter`, `commande:reseau:consulter`, `commande:remise:valider`, `commande:bon-livraison:emettre`. Format conforme. |
| C8 Module d'écran | `src/modules/commande/` : `/commandes` (trois vues pilotage, terrain, freelance), `/disponibilite` (trois états du commercial), tiroir panier. Entrées : « Commandes » (`commande:portefeuille:consulter` ou `commande:reseau:consulter`), « Disponibilité » (`commande:portefeuille:consulter`). Boutons non branchés de la démo : « bientôt ». |
| C9 Installer/désinstaller | Désinstaller ne supprime rien ; commandes et bons de livraison restent stockés et masqués ; test aller-retour. Avertissement : « Les commandes ne seront plus saisissables ; les factures déjà émises restent. » |
| C10 Démarrer seul | `profiles: ["commande"]` ; socle + `catalogue` + `pdv` + `reseau` (dépendances dures installées par le moteur). |
| C11 IA | `ia: { modeles: ['recommandation-panier', 'detection-erreur-commande'], finalites: ['suggestion-de-panier', 'controle-de-saisie'] }` : offre « recommandation de panier, détection d'erreurs » (cahier des charges de la démo). La démo est déterministe : le moteur est une règle en première version. Journal local des prédictions et corrections ; prédiction affichée avec modèle, version, date. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Migration additive. Interrupteur : `allocation-du-matin` (allocation par priorité des seules commandes en attente de stock, décision du PO du 2026-11-12 ; comportement seulement, jamais la forme des données). Un état de commande ajouté est lu comme inconnu par la version précédente. |
| C13 Installable sous contrôle | Prérequis : `catalogue` et `pdv` en service. Vérifications : `grille-resolue` (🟢 si 100 % des articles du jeu de contrôle résolvent un prix ; 🔴 si un seul n'en a pas) ; `plafond-lu` (🟢 si le plafond de 3 points de vente d'essai est projeté) ; `client-comptoir` (🟢 si chaque point de stock a son client comptoir). Lecture seule : `GET /api/v1/commandes`, `/commandes/{id}`, export. Export, import, effacement par organisation ; `objetsDeReprise: []` (la reprise demandée par le PO ne cite ni les commandes en cours ni l'historique, FR-216) ; `domainesEchange: []` en février (commandes terrain = Prospera, propriétaire par défaut, FR-14). |

### A.2 ★ Facturation, proforma et e-facture (`facturation`, M09)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'facturation'`, `1.0.0`. `depends: [{catalogue, "Une ligne de facture porte un article, une taxe et un prix résolu."}, {pdv, "Une facture est émise à un point de vente et lit ses conditions de règlement et son plafond."}, {paiement, "La Créance ouverte par la facture, son reste dû et les balances sont tenus par paiement (FR-247)."}]` (validées par le PO le 2026-11-12). `enrichiPar: [commande (facture à la livraison, en un clic), stock (sortie facturée, coût de revient), recouvrement, notification (envoi PDF et lien par WhatsApp, FR-249), freelance (facture émise par le freelance), connecteurs (export vers Sage, plus tard)]`. Service porteur : un service `facturation` ; `paiement-service` garde la Créance [À CONFIRMER, M09 : partiel, STORY-647/649]. |
| C2 Socle | Gate `FACTURATION_NOT_ENTITLED`. `organisationId` + portée. Un freelance ne lit que les factures qu'il émet à ses détaillants ; la société ne les lit jamais. |
| C3 Données possédées | Factures, lignes, avoirs, proformas et leur probabilité d'acceptation, **compteur de numérotation par série** (une série continue par organisation, et une série propre à chaque freelance émetteur), journal d'émission, statut e-facture (hors février). **Aucune créance** : le reste dû d'une facture est lu dans la Créance tenue par `paiement` (`paiement.creance@1`, FR-247). |
| C4 Emplacements vides | `paiement` absent n'est pas possible (dépendance dure) ; `commande` absent : « Facture depuis commande » = `NON_INSTALLE`, la facture se saisit directement ; `stock` absent : marge = `NON_INSTALLE` (le coût de revient vient du stock) ; `notification` absent : « Envoyer au client » = `NON_INSTALLE`, le PDF reste téléchargeable. |
| C5 Contrats nommés | Publie `facturation.facture.emise@1` (ouvre la Créance chez `paiement`), `facturation.facture.changed@1`, `facturation.avoir.emis@1` (réduit la Créance, ou crée un crédit du tiers sur une facture payée, FR-248), `facturation.facture.reprise@1` (facture ouverte reprise de Sage, FR-216), `facturation.proforma.changed@1`. Consomme `commande.bon-livraison.livre@1` (la facture naît à la livraison, sur les quantités livrées confirmées), `commande.commande.validee@1` (option « facturer dès la validation »), `paiement.creance.changed@1`, `paiement.creance.soldee`, `catalogue.grille.publiee@1`, `pdv.plafond.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Taux de TVA (18 % au Togo, référentiel fiscal du pays, calculé par taux sur le total HT avec un seul arrondi par taux), mentions légales (liste de travail jusqu'à la validation par l'expert-comptable du client, décision du PO du 2026-11-12), format du numéro (préfixe, année, largeur), séries (facture, avoir, proforma), durée de validité de la proforma, référentiel de conditions de règlement (lu de `pdv`). |
| C7 Droits | `facturation:facture:emettre`, `facturation:facture:consulter`, `facturation:avoir:emettre`, `facturation:proforma:gerer`, `facturation:balance:consulter`, `facturation:numerotation:administrer` (initialisation par la reprise, droit restreint). Format conforme. |
| C8 Module d'écran | `/facturation` (onglets Factures et créances, Proformas, E-facturation et avoirs). Entrées : « Factures » (`facturation:facture:consulter`), « Proformas » (`facturation:proforma:gerer`), « Balance clients » (`facturation:balance:consulter`). « Imprimer / PDF » et « Envoyer au client » sont exigés en février ; « Corriger et retransmettre » (e-facture OTR) : « bientôt » (la facture normalisée OTR n'est pas exigée en février). |
| C9 Installer/désinstaller | Rien n'est supprimé ; le **compteur de numérotation est conservé** : réinstaller reprend au numéro suivant, sans trou ni doublon. Avertissement : « Plus aucune facture ne pourra être émise ; la suite de numéros est conservée. » |
| C10 Démarrer seul | `profiles: ["facturation"]` ; socle + `catalogue` + `pdv` + `reseau` + `paiement`. |
| C11 IA | `ia: { modeles: ['score-acceptation-proforma', 'scoring-credit-client', 'prevision-encaissement'], finalites: ['aide-a-la-decision-credit', 'priorisation-des-creances'] }` : offre « scoring crédit, score d'acceptation, prévision 7/30 jours ». Le scoring de crédit est une aide : il n'accorde ni ne refuse seul (garde-fou « plafond de crédit non négociable »). |
| C12 Migrations | `retourArriere: 'SANS_PERTE'` (règle d'or : le compteur de numérotation ne change jamais de forme dans la fenêtre de 7 jours). Interrupteurs : `e-facture-otr` (certification, hors février), `avoir-automatique-sur-annulation`. |
| C13 Installable sous contrôle | Prérequis : `catalogue`, `pdv`, `paiement` ; référentiel fiscal du Togo publié. Vérifications : `numerotation-continue` (🟢 si la suite de la série n'a ni trou ni doublon sur les 100 derniers numéros ; 🔴 sinon) ; `creances-concordantes` (🟢 si, pour chaque facture, le TTC moins les avoirs égale le reste dû de sa Créance chez `paiement` plus les encaissements imputés, écart 0 FCFA ; 🔴 sinon). Lecture seule : consultation, PDF, export. **`objetsDeReprise: ['facturation.facture-ouverte@1', 'facturation.suite-numerotation@1']`** : objets issus des besoins du PO (factures impayées, suite de numérotation) ; noms proposés (FR-216, FR-217), modifiables ; valeurs de contrôle « reste dû » (montant, vérifié dans le registre de `paiement`) et « dernier numéro » (donnée). **`domainesEchange`** : rien en février (Connecteurs hors février, décision du PO). Déclaré au manifeste pour plus tard : `facturation.factures` (`MOUVEMENT`, `argent: true`, `controle: true`, publie `facturation.facture.emise@1`), un seul point d'écriture, avec identifiant stable et `rang`. Les créances ne sont plus un domaine de `facturation` : `paiement.creances` (A.17). |

### A.3 Approvisionnement et fournisseurs (`approvisionnement`, M10)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'approvisionnement'`, `1.0.0`. `depends: [{stock, "Le réapprovisionnement part du disponible, du seuil et de la couverture."}, {catalogue, "Une commande fournisseur vise des articles et des conditionnements."}]` (validées par le PO le 2026-11-12). `enrichiPar: [paiement (ordres de paiement fournisseurs, exigés, FR-209), finance-transactions (plancher de trésorerie, hors février), notification (alerte DAF), entrepot (réception), connecteurs (fournisseurs, plus tard)]`. |
| C2 Socle | Gate `APPROVISIONNEMENT_NOT_ENTITLED`. `organisationId` ; périmètre par entrepôt pour le responsable stock. |
| C3 Données possédées | Fournisseurs (registre, note explicable, délais, franco, plafonds, clause de reprise), commandes fournisseurs (cycle SUGGEREE → RECUE), demandes de retour fournisseur (nées d'un scénario de liquidation, FR-246), règles de réapprovisionnement, journal des suggestions et décisions. |
| C4 Emplacements vides | `finance-transactions` absent : plancher de trésorerie = `NON_INSTALLE` (l'écran le dit, garde-fou non vérifié) ; `paiement` absent : « Payer » = `NON_INSTALLE` ; `entrepot` absent : réception saisie directement dans `stock`. |
| C5 Contrats nommés | Publie `approvisionnement.commande-fournisseur.changed@1`, `approvisionnement.fournisseur.changed@1`, `approvisionnement.reception.enregistree@1`, `approvisionnement.escalade.demandee@1`, `approvisionnement.retour.changed@1`. Consomme `stock.alerte.changed@1`, `stock.disponible.changed@1`, `stock.liquidation.lancee@1`, `catalogue.article.changed@1`, `finance-transactions.tresorerie.changed@1`, `etat-publie.changed.*@1`. |
| C6 Paramètres | Règles de réappro (seuil, couverture cible), plancher de trésorerie avant tout envoi automatique, barème de note de fournisseur, regroupement franco/volume. Données, jamais code. |
| C7 Droits | `approvisionnement:fournisseur:gerer`, `approvisionnement:commande-fournisseur:valider`, `approvisionnement:commande-fournisseur:suggerer`, `approvisionnement:reception:enregistrer`, `approvisionnement:regle:definir`. Format conforme. |
| C8 Module d'écran | `/approvisionnement` (Réappro IA, Commandes fournisseurs, Fournisseurs, Règles). Entrées visibles avec `approvisionnement:fournisseur:gerer` ou `…:commande-fournisseur:valider`. « Basculer sur le fournisseur alternatif » : « bientôt ». |
| C9 Installer/désinstaller | Rien supprimé ; commandes fournisseurs en cours conservées ; avertissement : « Les suggestions de réapprovisionnement cessent ; les commandes ouvertes ne sont plus suivies. » |
| C10 Démarrer seul | `profiles: ["approvisionnement"]` ; socle + `catalogue` + `stock`. |
| C11 IA | `ia: { modeles: ['prevision-demande', 'scoring-fournisseur-explicable'], finalites: ['reapprovisionnement-propose', 'choix-fournisseur-justifie'] }`. Le garde-fou de trésorerie est une règle, non un modèle ; il n'est jamais contourné par la prédiction. |
| C12 | `SANS_PERTE`. Interrupteurs : `envoi-automatique-commande-fournisseur` (éteint par défaut), `escalade-daf`. |
| C13 | Prérequis : `stock` en service. Vérifications : `articles-lies` (🟢 si 100 % des articles suggérés existent au catalogue) ; `regle-valide` (🟢 si chaque règle a un seuil ≥ 0). Lecture seule : registre, commandes, export. **`objetsDeReprise: ['approvisionnement.fournisseur@1']`** : la spine de la Reprise désigne `approvisionnement` « à créer » (`ARCHITECTURE-SPINE.md` l. 387) ; `reprise.enrichiPar` le cite (PR #420) ; module non codé, « non installé » possible en février. `domainesEchange` : rien en février (Connecteurs hors février). Déclaré pour plus tard : `approvisionnement.fournisseurs` (propriétaire : le logiciel externe d'un client qui en garde un ; aucun pour le client de février, qui quitte Sage). |

### A.4 Opérations entrepôt (`entrepot`, M11)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'entrepot'`, `1.0.0`. `depends: [{stock, "Toute opération d'entrepôt écrit des mouvements de stock."}, {commande, "On prépare et expédie des commandes validées."}]` (validées par le PO le 2026-11-12 ; M11 « peut s'adosser à stock-service » [À CONFIRMER]). `enrichiPar: [reseau (zone desservie), terrain (remise d'espèces à l'expédition), facturation (bon de livraison facturé), approvisionnement (réception fournisseur)]`. |
| C2 Socle | Gate `ENTREPOT_NOT_ENTITLED`. `organisationId` et périmètre **par entrepôt** : le gestionnaire d'entrepôt ne voit que son site (`user.entrepot` dans la démo). |
| C3 Données possédées | Préparations, vagues de picking, expéditions, chargements de camion, exécution physique des transferts lancés par `stock` (navette, FR-245), réceptions et litiges, contrôles au quai, plannings d'inventaire tournant, affectation des préparateurs. Le camion (capacité) et le préparateur sont des données de l'organisation, pas des rôles. Les quantités sont écrites chez `stock` par mouvements, jamais ici. |
| C4 Emplacements vides | `commande` absent n'est pas possible (dépendance dure) ; `terrain` absent : encaissement à l'expédition = `NON_INSTALLE` ; `approvisionnement` absent : réception sans commande fournisseur liée ; `reseau` absent : zone de desserte = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `entrepot.preparation.commencee@1`, `entrepot.preparation.terminee@1`, `entrepot.expedition.livree@1`, `entrepot.reception.enregistree@1`, `entrepot.litige.ouvert@1`, `entrepot.inventaire.compte@1`. Consomme `commande.commande.validee@1`, `stock.disponible.changed@1`, `stock.point-de-stock.changed@1`, `stock.transfert.lance@1`, `etat-publie.changed.*@1`. `commande` lit ces faits pour ses statuts ; `entrepot` n'écrit jamais le statut d'une commande. |
| C6 Paramètres | Poids, volume et palettes par camion (attributs d'article, FR-242) ; coupure camion (heure limite : 15:30 à Lomé Port, 14:00 à Kara dans le jeu de démonstration) ; taille de vague ; seuil d'écart de réception ; fréquence d'inventaire tournant par classe ABC. |
| C7 Droits | `entrepot:preparation:realiser`, `entrepot:expedition:gerer`, `entrepot:chargement:gerer`, `entrepot:reception:controler`, `entrepot:inventaire:planifier`, `entrepot:livraison:confirmer`. La décision de liquider appartient à `stock` (FR-246). Format conforme. |
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
| C11 | `ia: { modeles: ['scoring-prospects', 'allocation-quotas'], finalites: ['priorisation-prospects', 'suggestion-allocation'] }` : offre « scoring prospects, suggestions d'allocation » (cahier des charges du bundle Croissance et Opérations). |
| C12 | `SANS_PERTE`. Interrupteur : `passation-automatique`. |
| C13 | Prérequis : `reseau`, `pdv`. Vérification : `zones-chargees` (🟢 si ≥ 1 zone lue). Lecture seule : consultation, export. `objetsDeReprise: []` : les prospects ne sont pas repris en février ; la reprise demandée par le PO porte sur clients, articles, tarifs, factures ouvertes et numérotation (brain dump, §2). `domainesEchange: []`. |

### A.6 Studio réseaux sociaux (`studio-social`, M24)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'studio-social'` (**code à tiret**), `1.0.0`. `depends: []`. `enrichiPar: [marketing (campagnes), stock (produits à écouler), commande (ventes), notification (réponses WhatsApp), recouvrement (retard de paiement, qui interdit la réponse automatique, FR-90)]`. Service à créer [À CONFIRMER, M24]. |
| C2 Socle | Gate `STUDIO_SOCIAL_NOT_ENTITLED`. `organisationId` ; périmètre par compte social connecté. |
| C3 Données possédées | Calendrier éditorial, publications (brouillon, validée, programmée, publiée), comptes connectés (jetons chiffrés), boîte de réception, réponses automatiques, mesure de ROI incrémental. |
| C4 Emplacements vides | `stock` absent : « suggestions depuis le stock » = `NON_INSTALLE` ; `marketing` absent : rattachement à une campagne = `NON_INSTALLE` ; `commande` absent : ROI incrémental = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `studio-social.publication.changed@1`, `studio-social.message.recu@1`. Consomme `stock.alerte.changed@1`, `marketing.campagne.changed@1`, `recouvrement.dossier.changed@1`, `etat-publie.changed.*@1`. |
| C6 | Réseaux activés (Facebook, Instagram, TikTok, WhatsApp), fenêtres de publication, charte éditoriale, règle de validation avant publication. Données. |
| C7 | `studio-social:publication:programmer`, `studio-social:publication:valider`, `studio-social:compte:connecter`, `studio-social:message:repondre` (forme élargie, en attente du format). |
| C8 | `/marketing/social`. Entrées : « Calendrier » (`…:publication:programmer`), « Boîte de réception » (`…:message:repondre`). « Valider et programmer » et « Envoyer » : « bientôt » tant que l'OAuth Meta n'est pas raccordé. |
| C9 | Rien supprimé ; les jetons des comptes sont révoqués à la désinstallation et à la réinstallation il faut reconnecter ; avertissement le dit. |
| C10 | `profiles: ["studio-social"]` ; socle seul. |
| C11 | `ia: { modeles: ['accroches-posts', 'classification-messages'], finalites: ['redaction-assistee', 'tri-de-la-boite'] }`. Toute accroche générée porte sa provenance et reste validée par un humain avant publication. |
| C12 | `SANS_PERTE`. Interrupteur : `reponse-automatique`. |
| C13 | Prérequis : application Meta approuvée, jetons valides [À CONFIRMER]. Vérification : `compte-joignable` (🟢 si l'appel de test au réseau répond en moins de 5 s). Interception en essai : aucune publication réelle ; lecture seule : calendrier, export. `objetsDeReprise: []`, `domainesEchange: []`. Hors périmètre de février : le module n'est pas parmi ceux dont le client de février a besoin (brain dump, §3). |

### A.7 Réseau freelance (`freelance`, M42)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'freelance'`, `1.0.0`. **Add-on, non un module** [À CONFIRMER, M42 : manifeste ou option de pack]. Décision du PO du 2026-11-12 : le freelance **vend pour le compte de la société** ; il n'achète pas de stock. `depends: [{catalogue, "Le freelance vend les articles de la société au prix société et fixe son propre prix au détaillant (FR-C28)."}, {pdv, "Le portefeuille du freelance est un ensemble de points de vente."}]` (validées par le PO le 2026-11-12). `enrichiPar: [commande (vente du freelance servie par le stock de la société), facturation (facture émise par le freelance à son détaillant), paiement (prix société dû par le freelance, créances de son espace propre), terrain, equipe (classement séparé)]`. |
| C2 Socle | Gate `FREELANCE_NOT_ENTITLED`. Cloisonnement le plus strict du produit : par `organisationId` **et par freelance** ; deux freelances ne se voient pas (FR-C30) ; la société ne voit ni ses prix au détaillant ni sa marge (FR-C29). |
| C3 Données possédées | Statut de l'indépendant (activation, départ), classement séparé, commissions (taux × montant **au prix société** de ses ventes, acquises à la facturation). Décisions du PO : le stock reste à la société jusqu'à la livraison au détaillant ; le freelance doit le prix société à la société, même si son détaillant ne paie pas ; cette somme est une Créance de `paiement` dont le tiers est le freelance (FR-247). Ses factures à ses détaillants et leurs créances vivent dans son espace propre (`facturation`, `paiement`, périmètre « freelance »), invisibles de la société. **Ses prix au détaillant appartiennent à `catalogue`, jamais ici.** |
| C4 Emplacements vides | `commande`/`facturation` absents : ventes et commissions du freelance = `NON_INSTALLE` ; `paiement` absent : prix société dû = `NON_INSTALLE` ; `equipe` absent : classement = `NON_INSTALLE`. |
| C5 Contrats nommés | Publie `freelance.freelance.active@1`, `freelance.commission.acquise@1` (base : prix société facturé). Le départ d'un freelance n'a qu'une source, `pdv.commercial.parti@1`. Consomme `reseau.commercial.changed@1`, `pdv.commercial.parti@1`, `catalogue.profil.changed@1`, `facturation.facture.emise@1` (vente facturée du freelance). |
| C6 | Barème d'abonnement par freelance actif (add-on), règles d'activation, taux de commission, plafond d'encours du freelance. Marge minimale : elle avertit, elle ne bloque pas. Données. |
| C7 | `freelance:portefeuille:consulter` (le sien), `freelance:creance:consulter` (les siennes), `freelance:commission:consulter` (la sienne ; la direction par droit explicite), `freelance:classement:consulter`, `freelance:freelance:activer`. Aucun droit ne donne à la société la lecture de ses prix au détaillant ni de sa marge. |
| C8 | Cockpit du freelance (`DashboardFreelance`), « Mon portefeuille », « Mes prix » (écran servi par `catalogue`), « Mes ventes » (ventes pour le compte de la société, prix société dû, commission). « Mes commandes grossiste » n'existe pas : le freelance n'achète pas de stock. La marge n'est visible que du freelance (FR-195). |
| C9 | Rien supprimé ; au départ d'un freelance, la révélation des prix suit le seul processus de `pdv` (`pdv.commercial.parti@1`). Avertissement : « Désinstaller l'add-on ne révèle aucun prix à la société. » |
| C10 | `profiles: ["freelance"]` ; socle + `catalogue` + `pdv` + `reseau`. |
| C11 | Sans objet au premier jour : « recommandation de prix client » et « marge optimale » (offre) supposeraient d'apprendre sur des prix que la société n'a pas le droit de voir (FR-C29). Aucune finalité d'apprentissage ne lit un prix de freelance ; tout modèle futur exige une décision du PO et un consentement du freelance. |
| C12 | `SANS_PERTE`. Interrupteur : `activation-par-freelance` (facturation de l'add-on). |
| C13 | Prérequis : `catalogue`, `pdv`. Vérification : `etancheite-prix` (🟢 si un compte « société » du jeu de contrôle reçoit 0 champ de prix de revente sur 20 requêtes d'API ; 🔴 sinon). Export par organisation : **l'export de la société exclut les prix du freelance au détaillant et les factures qu'il émet** (FR-C29) ; l'export du freelance lui est propre. `objetsDeReprise: []`, `domainesEchange: []` (jamais d'échange : les prix du freelance ne sortent pas). |

### A.8 ★ Commercial terrain et application mobile (`terrain`, M12)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'terrain'`, `1.0.0`. `depends: [{reseau, "Les tournées, la carte d'équipe et la couverture se rattachent aux zones."}]`. `enrichiPar: [pdv (clients visités), commande, catalogue, stock (relevé du commercial, FR-S56), paiement (encaissement terrain), recouvrement (tournée de recouvrement), facturation, notification]`. **Un seul service pour deux verticales** (distributeur et microfinance : agents terrain, collecte) : le vocabulaire (« visite », « client » ou « membre », « tournée ») est une **donnée** (C6), pas deux modules. Application mobile `prospera-terrain`. |
| C2 | Gate `TERRAIN_NOT_ENTITLED`. `organisationId` et portée ; le commercial ne voit que sa tournée ; le superviseur son équipe. |
| C3 | Tournées (PJP), missions, visites et leur clôture (résultat, commentaire, photos géolocalisées), positions GPS d'équipe, remises d'espèces et écarts de caisse, agenda. |
| C4 | `pdv` absent : la visite vise un lieu libre, « point de vente » = `NON_INSTALLE` ; `commande` absent : « Prendre une commande » = `NON_INSTALLE` ; `stock` absent : relevé de stock = `NON_INSTALLE` ; `paiement` absent : encaissement = `NON_INSTALLE`. Test par dépendance. |
| C5 | Publie `terrain.visite.cloturee@1`, `terrain.remise.declaree@1`, `terrain.position.changed@1`, `terrain.releve-stock.saisi@1`. Consomme `reseau.noeud.created@1`, `reseau.portee.changed@1`, `pdv.point-de-vente.changed@1`, `commande.commande.validee@1`, `paiement.encaissement.valide`. |
| C6 | Vocabulaire par verticale (libellés en donnée), durée d'une visite, rayon de géofencing, barème de caisse (seuil d'écart), fenêtre d'optimisation de tournée. |
| C7 | `terrain:visite:realiser`, `terrain:tournee:planifier`, `terrain:equipe:consulter`, `terrain:mission:affecter`, `terrain:remise:declarer`, `terrain:remise:valider`. Format conforme. |
| C8 | `/commercial` (carte GPS d'équipe, coaching), `/tournees` (PJP, strike rate, caisse), `/mon-activite` (« Ma journée », clôture de visite). Fond de carte Google Maps commun (FR-192). Menus : « Ma journée » (`terrain:visite:realiser`), « Tournées » (`terrain:tournee:planifier`), « Équipe » (`terrain:equipe:consulter`). « Y aller » et « Clôturer » doivent aboutir en février. **L'application terrain Flutter `prospera-terrain`, hors connexion, est exigée** (parcours UJ-2), jamais « bientôt » : elle se distribue au prospect de l'essai par un lien de téléchargement, avec une connexion par rôle à un clic dans l'essai. |
| C9 | Rien supprimé ; visites et positions conservées. Avertissement : « Les tournées et la clôture de visite cesseront ; l'application mobile ne se synchronisera plus. » |
| C10 | `profiles: ["terrain"]` ; socle + `reseau`. |
| C11 | `ia: { modeles: ['optimisation-tournees', 'recommandation-panier', 'validation-geofencing'], finalites: ['planification-de-tournee', 'aide-a-la-commande', 'controle-de-presence'] }` : offre « optimisation de tournées, géofencing » ; le compte rendu vocal (voice-to-CRM) est affiché « bientôt », sans date. Données de position, décision du PO du 2026-11-12 : niveau de consentement 0 par défaut, information de l'agent à l'embauche, conservation de 90 jours glissants puis purge ; un avis juridique est à obtenir. |
| C12 | `SANS_PERTE`. La **synchronisation de l'appareil** doit lire deux versions : l'appareil tolère un champ inconnu. Interrupteurs : `mode-hors-ligne`, `optimisation-automatique`. |
| C13 | Prérequis : `reseau` ; Google Maps pour la carte. Vérifications : `zones-lues` (🟢 si ≥ 1 zone) ; `fond-de-carte` (🟢 si la clé Google Maps répond). Lecture seule : consultation des visites, export. Essai : aucune position réelle collectée ; un mode « démonstration » simule la position, de façon visible à l'écran, calée sur les points de vente du jeu. Vérification `purge-positions` (🟢 si aucune position n'a plus de 90 jours). `objetsDeReprise: []`, `domainesEchange: []` (visites et commandes terrain = Prospera, FR-14). |

### A.9 ★ Relances et recouvrement (`recouvrement`, M19)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'recouvrement'`, `1.0.0`. **Deux verticales** (distributeur : factures impayées ; microfinance : impayés de crédit, PAR), même service, **vocabulaire en donnée**. `depends: [{paiement, "La Créance (registre unique), les promesses et les liens de paiement sont portés par paiement."}, {notification, "Les relances multicanal partent par notification."}]`. La Créance est tenue par `paiement` (décision du PO du 2026-11-12) ; `recouvrement` la **lit**, il n'en possède aucune copie. Chaque verticale alimente la source par `enrichiPar`. `enrichiPar: [facturation (source FACTURE), credit (impayés IMF ; proposition, à valider par le PRD microfinance), pdv (blocage du crédit chez le distributeur), terrain (tournée de recouvrement), finance-transactions (provisions, plus tard)]`. |
| C2 | Gate `RECOUVREMENT_NOT_ENTITLED`. `organisationId` et portée : le recouvrement ne voit que ses dossiers (`/relances` « Mes dossiers »), le commercial « Mes relances ». |
| C3 | Dossiers de recouvrement (un par tiers, qui liste ses créances, par défaut), séquence d'escalade, promesses de paiement, décision de blocage ou déblocage du crédit avec trace de surcharge, journal d'actions. La balance âgée est lue dans `paiement` (FR-247), jamais recopiée. |
| C4 | Aucune Créance de source `FACTURE` (`facturation` absent) : dossiers du distributeur vides, `NON_INSTALLE` ; `pdv` absent (cas d'une autre verticale) : le blocage du crédit est publié (`recouvrement.credit.bloque@1`) et lu directement par les modules qui en ont besoin ; `terrain` absent : « visite de recouvrement » = `NON_INSTALLE` ; `credit` absent : source IMF = `NON_INSTALLE`. |
| C5 | Publie `recouvrement.dossier.changed@1`, `recouvrement.credit.bloque@1`, `recouvrement.credit.debloque@1`, `recouvrement.promesse.changed@1`, `recouvrement.alerte-direction.emise@1`. Consomme `paiement.creance.materialisee`, `paiement.creance.changed@1`, `paiement.creance.soldee`, `paiement.credit-tiers.changed@1`, `paiement.promesse.constatee`, `notification.reponse.recue`, `pdv.plafond.changed@1`. |
| C6 | Une seule table de seuils, paramétrable : J+1, rappel ; J+30, alerte à la direction ; créance échue depuis plus de 60 jours ou encours au-dessus du plafond, blocage automatique du crédit (règle auditée) ; déblocage jamais automatique. Séquence d'escalade par défaut (FR-114 : WhatsApp, repli SMS, visite, direction) en données ; `SEUIL_EXCLUSION_JOURS` (30 jours) ; cinq tranches de balance âgée ; modèles de message ; vocabulaire par verticale. |
| C7 | `recouvrement:dossier:traiter`, `recouvrement:relance:envoyer`, `recouvrement:promesse:enregistrer`, `recouvrement:credit:bloquer`, `recouvrement:credit:debloquer` (DAF seul par défaut), `recouvrement:regle:definir`, `recouvrement:balance:consulter`. Format conforme. |
| C8 | `/relances`, balance âgée, blocage de crédit avec trace. Menus : « Mes dossiers » (`recouvrement:dossier:traiter`), « Balance âgée » (`recouvrement:balance:consulter`). « Relancer » et « Bloquer le crédit » doivent aboutir en février. |
| C9 | Rien supprimé ; promesses et dossiers conservés ; les crédits suspendus restent suspendus chez `pdv`. Avertissement : « Les crédits déjà bloqués le restent jusqu'à déblocage manuel dans les points de vente. » |
| C10 | `profiles: ["recouvrement"]` ; socle + `paiement` + `notification`. |
| C11 | `ia: { modeles: ['priorisation-par-probabilite', 'choix-du-canal'], finalites: ['priorisation-des-dossiers', 'choix-du-canal-de-relance'] }`. Le blocage du crédit n'est jamais décidé par le modèle seul : il suit la règle chiffrée de C6. |
| C12 | `SANS_PERTE`. Interrupteurs : `blocage-automatique-au-seuil` (allumé par défaut), `relance-automatique`. |
| C13 | Prérequis : `paiement`, `notification` en service. Vérifications : `source-creances` (🟢 si le registre des Créances de `paiement` répond et qu'au moins une source est installée) ; `canal-utilisable` (hérité de `notification`). Essai : aucune relance réelle partie. `objetsDeReprise: []` : les promesses ne sont pas reprises ; la reprise demandée par le PO ne les cite pas (brain dump, §2). `domainesEchange: []` (promesses et relances = Prospera). |

### A.10 Équipes et performance (`equipe`, M21)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'equipe'`, `1.0.0`. Deux verticales (distributeur, microfinance). `depends: [{reseau, "Les équipes et leurs commerciaux viennent du réseau."}]`. `enrichiPar: [pdv, commande, terrain, conquete-objectifs, freelance, facturation]`. Code déjà au catalogue, déprécié, à réactiver. |
| C2 | Gate `EQUIPE_NOT_ENTITLED`. `organisationId` et portée de zone : le responsable des ventes lit sa région, le superviseur son équipe. |
| C3 | Indicateurs individuels calculés, classements, plans de coaching, matrice des postes, benchmarks, typologie salarié/freelance (copie de `reseau.commercial`). Commission des salariés calculée sur l'**encaissé** (décision du PO du 2026-11-12) ; celle du freelance vient de `freelance` (prix société facturé). Le score d'un freelance vu de la société ne dépend jamais de sa marge. |
| C4 | Chaque indicateur dont la source est absente = `NON_INSTALLE` ; `freelance` absent : classement freelance = `NON_INSTALLE`. |
| C5 | Publie `equipe.coaching.changed@1`. Consomme `reseau.commercial.changed@1`, `commande.commande.validee@1`, `facturation.facture.emise@1`, `terrain.visite.cloturee@1`, `conquete-objectifs.objectif.changed@1`. |
| C6 | Définition des KPI, barèmes de classement, matrice des postes. Données. |
| C7 | `equipe:indicateur:consulter`, `equipe:classement:consulter`, `equipe:coaching:gerer`. La validation des demandes de remise appartient à `commande` (`commande:remise:valider`) ; l'écran « Validations » l'appelle. |
| C8 | `/equipe` (`EquipeView`, `MatricePostesPanel`). Menus : « Équipe » (`equipe:indicateur:consulter`). Le superviseur et le responsable ne voient plus la « Vue DG » (FR-186). |
| C9 | Rien supprimé ; coachings conservés. Avertissement : « Les classements ne seront plus calculés. » |
| C10 | `profiles: ["equipe"]` ; socle + `reseau`. |
| C11 | `ia: { modeles: ['ecart-de-performance', 'coaching-cible'], finalites: ['coaching-individuel', 'benchmark-bonnes-pratiques'] }`. « Recommandation de prix client (freelance) » exclue (FR-C29). |
| C12 | `SANS_PERTE`. Interrupteur : `classement-public-equipe`. |
| C13 | Prérequis : `reseau`. Vérification : `commerciaux-lus` (🟢 si ≥ 1 commercial). Lecture seule : consultation, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.11 Comptabilité et finance, transactions (`finance-transactions`, M22)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'finance-transactions'` (**code à tiret**), `1.0.0`. Trois verticales (distributeur, microfinance, assurance). `depends: [{paiement, "Rapprochement et ordres de paiement reposent sur les encaissements et les ordres de paiement."}]`. `enrichiPar: [facturation (lettrage 411), approvisionnement (factures d'achat, run fournisseurs), balance (écritures, atelier de balance), connecteurs (export comptable plus tard)]`. Service à créer [À CONFIRMER, M22]. **Hors périmètre de février** (décision du PO du 2026-11-12 : la comptabilité n'est pas considérée pour février ; aucune comptabilité de référence n'y est exigée). Les exigences du module restent dans le PRD pour après. **Le produit ne passe pas d'écritures de grand livre à ce jour** (note M22) : le périmètre est le rapprochement, la trésorerie et le run de paiement. En février, les ordres de paiement aux fournisseurs vivent dans `paiement` (FR-209). |
| C2 | Gate `FINANCE_TRANSACTIONS_NOT_ENTITLED`. `organisationId` ; droits financiers par rôle (DAF, comptable). |
| C3 | Rapprochements bancaires d'un compte de trésorerie, suspens, écritures de caisse des remises d'espèces (la remise elle-même est un objet de `terrain`, sa validation un encaissement de `paiement`), prévision de trésorerie à 7 jours, BFR, run de paiement (état, jamais l'ordre : il appartient à `paiement`). |
| C4 | `facturation` absent : lettrage = `NON_INSTALLE` ; `approvisionnement` absent : run fournisseurs = `NON_INSTALLE` ; `balance` absent : écritures = `NON_INSTALLE`. |
| C5 | Publie `finance-transactions.tresorerie.changed@1`, `finance-transactions.rapprochement.effectue@1`. Consomme `paiement.encaissement.valide`, `paiement.encaissement.ecart.constate`, `paiement.creance.changed@1`, `approvisionnement.commande-fournisseur.changed@1`. |
| C6 | Plancher de trésorerie, horizon de prévision, règles de lettrage automatique (montant et référence), tolérance d'arrondi. |
| C7 | `finance-transactions:rapprochement:effectuer`, `finance-transactions:tresorerie:consulter`, `finance-transactions:run:consulter`, `finance-transactions:suspens:traiter`. Préparer et valider un ordre exigent en plus `paiement:*` (deux droits, deux personnes, FR-P66). |
| C8 | `/comptabilite`, `/pilotage-financier` (DAF). Menus : « Rapprochement » (`…:rapprochement:effectuer`), « Trésorerie » (`…:tresorerie:consulter`), « Run fournisseurs » (`…:run:consulter`). Module hors février : ses boutons « Accorder », « Refuser » et « Télédéclarer sur le portail OTR » restent « bientôt », sans date. « Payer » un fournisseur passe par les ordres de `paiement` (FR-209), exigés en février. |
| C9 | Rien supprimé ; rapprochements conservés. Avertissement : « Les rapprochements cessent ; les paiements restent chez le module paiement. » |
| C10 | `profiles: ["finance-transactions"]` ; socle + `paiement`. |
| C11 | `ia: { modeles: ['reconciliation-auto', 'detection-anomalies', 'prevision-tresorerie'], finalites: ['lettrage-assiste', 'alerte-anomalie', 'prevision-de-cash'] }`. Un rapprochement proposé est toujours confirmé par un humain en v1. |
| C12 | `SANS_PERTE`. Interrupteurs : `lettrage-automatique`, `alerte-doublon`. |
| C13 | Prérequis : `paiement`. Vérification : `suspens-bornes` (🟢 si le montant en suspens ≤ seuil de l'organisation). Lecture seule : consultation, export. `objetsDeReprise: []`. `domainesEchange: []` en février (Connecteurs hors février). |

### A.12 Marketing et campagnes (`marketing`, M23)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'marketing'`, `1.0.0`. Deux verticales. `depends: [{pdv, "L'audience est une liste de points de vente (FR-V29)."}, {notification, "Un envoi de campagne part par notification."}]`. `enrichiPar: [stock (combos d'écoulement), recouvrement (exclusion des clients en défaut, FR-211), facturation (créance la plus ancienne), catalogue (promotions), studio-social]`. |
| C2 | Gate `MARKETING_NOT_ENTITLED`. `organisationId` et portée de zone ; le responsable marketing voit « Mon audience ». |
| C3 | Campagnes, segments (copie des critères, jamais des personnes), combos stock → promotions, validations DG, résultats et ROI, scoring de leads. |
| C4 | `recouvrement`/`facturation` absents : exclusion des clients en défaut = « non évaluée » (**jamais** « aucun client exclu »), confirmation explicite avant envoi ; `stock` absent : combos = `NON_INSTALLE`. |
| C5 | Publie `marketing.campagne.changed@1`, `marketing.combo.valide@1`. Consomme `pdv.point-de-vente.changed@1`, `stock.alerte.changed@1`, `stock.liquidation.lancee@1` (combo né d'un plan de liquidation, FR-246), `recouvrement.credit.bloque@1`, `paiement.creance.changed@1`, `notification.envoi.delivre`, `notification.reponse.recue`. |
| C6 | `SEUIL_EXCLUSION_JOURS` (lu), plafond de messages par destinataire (porté par `notification`, FR-212), seuil de remise exigeant une validation DG, canaux d'une campagne. |
| C7 | `marketing:campagne:gerer`, `marketing:campagne:valider`, `marketing:combo:proposer`, `marketing:combo:valider`, `marketing:segment:gerer`, `marketing:audience:consulter`. Format conforme. |
| C8 | `/marketing` (vue opérateur, vue DG), `CombosStockPanel`. Menus : « Campagnes » (`marketing:campagne:gerer`), « Combos » (`marketing:combo:proposer`), « Mon audience » (`marketing:audience:consulter`). « Lancer », « Modifier », « Ignorer » doivent aboutir pour le circuit combos stock en février ; le chatbot WhatsApp : « bientôt ». |
| C9 | Rien supprimé ; campagnes conservées. Avertissement : « Les campagnes en cours ne seront plus envoyées. » |
| C10 | `profiles: ["marketing"]` ; socle + `pdv` + `notification` + `reseau`. |
| C11 | `ia: { modeles: ['scoring-leads', 'segmentation-comportementale'], finalites: ['ciblage-campagne', 'segmentation'] }`. |
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
| C11 | `ia: { modeles: ['synthese-ecarts'], finalites: ['explication-des-ecarts', 'alerte-de-bande'] }`. |
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
| C13 | Prérequis : au moins un module source (valeur par défaut). Vérification : `regles-valides` (🟢 si 100 % des règles respectent la grammaire fermée). Essai : les règles ne produisent aucune action réelle (interceptées). `objetsDeReprise: []`, `domainesEchange: []`. |

### A.15 Tableau de bord et pilotage (`dashboard`, M28)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'dashboard'`, `1.0.0`. Quatre verticales. `depends: []`. `enrichiPar:` tous les modules du distributeur (`commande`, `facturation`, `stock`, `pdv`, `recouvrement`, `terrain`, `paiement`, …). Code au catalogue, déprécié, à réactiver. Aucun module n'en dépend en dur. |
| C2 | Gate `DASHBOARD_NOT_ENTITLED`. `organisationId` et portée : chaque rôle ne reçoit que les cartes que ses droits sur les modules sources autorisent. |
| C3 | Définitions de cartes et de KPI par rôle, alertes du jour, rapports de direction générés, règle du score de santé et scores calculés (déposés dans `pdv` avec leur provenance, FR-184), diagnostics d'article (rentabilité, engouement, FR-243). **Les décisions à trancher ne sont pas à lui** : chaque module possède les siennes (même schéma, FR-14) ; `dashboard` les liste. Pas de copie des données des autres modules (agrégation à la demande). |
| C4 | Chaque carte dont la source est absente = `NON_INSTALLE` ; un cockpit s'affiche avec ses seules cartes disponibles. |
| C5 | Publie `dashboard.rapport.genere@1`, `dashboard.score-pdv.calcule@1` (lu par `pdv`, FR-184), `dashboard.article.diagnostic@1` (FR-243). Consomme les faits des modules sources, dont leurs décisions (`<module>.decision.changed@1`), et `etat-publie.changed.*@1`. |
| C6 | Cartes par rôle (en donnée), seuils d'alerte, huit chiffres du DG, modèle du rapport. |
| C7 | `dashboard:tableau:consulter`, `dashboard:vue-direction:consulter` (DG et DC seulement, FR-7), `dashboard:rapport:envoyer`, `dashboard:alerte:configurer`. Trancher une décision exige le droit du module qui la possède (par exemple `commande:remise:valider`). Format conforme. |
| C8 | `/dashboard` (15 cockpits par rôle), rapport IA. Le DG « voit tout » ; une carte « Vue DG » est conditionnée par `dashboard:vue-direction:consulter` (FR-186). Boutons « PDF », « Envoyer », décisions « Valider » / « Reporter » doivent aboutir en février ; « Valider » et « Reporter » appellent le module qui possède la décision. |
| C9 | Rien supprimé ; définitions et décisions conservées. Avertissement : « Les tableaux de bord disparaissent du menu ; aucune donnée métier n'est touchée. » |
| C10 | `profiles: ["dashboard"]` ; socle seul. |
| C11 | `ia: { modeles: ['synthese-narrative', 'prevision-ca', 'scoring-sante-pdv'], finalites: ['rapport-de-direction', 'prevision-ca-trimestrielle', 'score-de-sante'] }`. Le « Copilot conversationnel » de l'offre n'a pas d'écran dans la démo (seulement des encarts « DAF Copilot ») : il est affiché « bientôt », sans date. Tout score porte source, date et version (FR-184). |
| C12 | `SANS_PERTE`. Interrupteurs : `rapport-ia-quotidien`, `scoring-sante-pdv`. |
| C13 | Prérequis : aucun module obligatoire. Vérification : `cartes-resolues` (🟢 si ≥ 80 % des cartes d'un cockpit d'essai se résolvent, les autres affichant `NON_INSTALLE`). Lecture seule : tous les cockpits, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.16 Support client et CRM interne (`support-client`, M03)

| Clause | Valeur pour ce module |
|---|---|
| C1 | `code: 'support-client'` (**code à tiret**), `1.0.0`. Quatre verticales [À CONFIRMER, M03], service `support-crm-service` à créer. `depends: []`. `enrichiPar: [pdv (fiche client), commande, facturation, entrepot (litiges de livraison), notification]` (liens proposés, modifiables : aucune source du distributeur ne décrit ce module). **Aucune source du distributeur ne décrit ce module** : la démo n'a pas d'écran de support. Il est inscrit pour la complétude des seize modules. |
| C2 | Gate `SUPPORT_CLIENT_NOT_ENTITLED`. `organisationId`. |
| C3 | Dossiers de support (réclamation, litige de livraison, facture contestée), échanges, statuts. Données proposées, modifiables ; le module est inscrit pour la complétude des seize modules. |
| C4 | Chaque module lié absent : lien du dossier = `NON_INSTALLE`. |
| C5 | Publie `support-client.dossier.changed@1`. Consomme `pdv.point-de-vente.changed@1`, `commande.commande.changed@1`, `facturation.facture.changed@1`. |
| C6 | Types de dossier, délais de réponse, modèles de réponse. |
| C7 | `support-client:dossier:ouvrir`, `support-client:dossier:traiter`, `support-client:dossier:cloturer`. |
| C8 | Aucun écran dans la démo ni dans la liste du PO : écrans **à concevoir**, hors périmètre de février (brain dump, §3). |
| C9 | Rien supprimé ; dossiers conservés. Avertissement : « Les dossiers ouverts ne seront plus suivis. » |
| C10 | `profiles: ["support-client"]` ; socle seul. |
| C11 | Sans objet : aucun modèle n'est promis par l'offre pour ce module ; tout résumé automatique de dossier ouvrirait la clause. |
| C12 | `SANS_PERTE`. `interrupteurs: []`. |
| C13 | Prérequis : aucun. Vérification : `dossier-cree` (🟢 si un dossier d'essai se crée et se relit). Lecture seule : consultation, export. `objetsDeReprise: []`, `domainesEchange: []`. |

### A.17 Les huit modules de la partie 4 : renvoi aux manifestes

Ces huit modules ont déjà leurs treize clauses dans leur manifeste. Ce PRD **ne les répète pas** ; il renvoie. Les modules ★ sont `pdv`, `catalogue`, `stock` et `paiement`.

| Module | Manifeste | Dépend de (dures) | Enrichi par | Objets de reprise | Domaines d'échange | Point à reporter |
|---|---|---|---|---|---|---|
| `reseau` | `manifestes/reseau.manifest.ts` | aucune | `pdv`, `stock` | `reseau.zone@1`, `reseau.commercial@1` | `reseau.commerciaux` | FR-180 à FR-183 |
| ★ `pdv` | `manifestes/pdv.manifest.ts` | `reseau` | `stock`, `commande`, `facturation`, `terrain`, `recouvrement`, `catalogue` ; **ajouter `dashboard`** (score de santé, FR-184) et `paiement` (encours, FR-187) | `pdv.point-de-vente@1`, `pdv.affectation@1` | `pdv.points-de-vente` | FR-184 à FR-192, FR-240, FR-241 (client comptoir) ; prérequis `fond-de-carte` (Google Maps) |
| ★ `catalogue` | `manifestes/catalogue.manifest.ts` | aucune | `reseau`, `pdv`, `stock`, `commande` | `catalogue.article@1`, `catalogue.grille@1` | `catalogue.articles`, `catalogue.prix` | FR-193 à FR-198, FR-242, FR-243 ; grille « ce client » ; droit `catalogue:marge:consulter` à ajouter |
| ★ `stock` | `manifestes/stock.manifest.ts` | `catalogue` | `balance`, `commande`, `pdv`, `reseau`, `terrain` ; **ajouter `entrepot`** (navette), `marketing` et `approvisionnement` (scénarios de liquidation) | `stock.point-de-stock@1`, `stock.stock-ouverture@1` | `stock.mouvements`, `stock.disponible` | FR-199 à FR-204, FR-244 à FR-246 ; faits à ajouter : `stock.transfert.lance@1`, `stock.liquidation.lancee@1` |
| ★ `paiement` | `manifestes/paiement.manifest.ts` | aucune | `notification`, `facturation` ; **ajouter `commande`** (encours) | aucun (la Créance d'une facture reprise s'ouvre sur le fait de `facturation`, FR-216) | `paiement.encaissements` ; `paiement.creances` (déclaré pour plus tard) | FR-205 à FR-210, FR-247 (Créance, registre unique : contrat `paiement.creance@1`, faits `paiement.creance.changed@1`), FR-248 (crédit du tiers : `paiement.credit-tiers.changed@1`) ; droits d'ordre à rendre lisibles (`paiement:ordre:*` [À CONFIRMER]) |
| `notification` | `manifestes/notification.manifest.ts` | aucune | aucun | aucun | aucun | FR-211 à FR-214, FR-249 |
| `reprise` | `manifestes/reprise.manifest.ts` | aucune | `pdv`, `catalogue`, `reseau`, `stock`, `facturation`, `approvisionnement` (ajouté, PR #420), `assurance`, `sinistres` | aucun | aucun | FR-215 à FR-217 |
| `connecteurs` | `manifestes/connecteurs.manifest.ts` | aucune | `reprise`, `pdv`, `catalogue`, `stock`, `facturation`, `paiement` (remplace `pi-spi`, PR #420), `approvisionnement` | aucun | aucun | FR-218, FR-219 |

#### Problèmes de contrat repérés (à lire avant de les corriger)

1. **Codes à tiret.** `conquete-objectifs`, `studio-social`, `controle-gestion`, `finance-transactions` et `support-client` ne passent pas le format de droit actuel d'`auth-service`. La story d'élargissement (amendement C7 du 2026-11-11) doit se livrer **avant la semaine 5** ; sans elle, les cinq modules ne peuvent pas déclarer un seul droit.
2. **Aucun cycle de dépendance dure** dans le graphe (préambule). Les liens retour sont tous des `enrichiPar` (`pdv` → `commande`, `stock` → `commande`, `catalogue` → `stock`, `paiement` → `facturation`…), ce que le contrat autorise ; le catalogue de modules les valide tout de même au `MANIFESTE_CYCLE`.
3. ✅ **Corrigé (PR #420).** `connecteurs.enrichiPar` cite maintenant `paiement` à la place de `pi-spi`, conformément à la décision du PO (PI-SPI est un moyen de paiement, pas un module).
4. ✅ **Corrigé (PR #420).** `reprise.enrichiPar` inclut maintenant `approvisionnement` (reprise des fournisseurs, spine de la Reprise).
5. **`facturation` est la cible de reprise des factures impayées** (`facturation.facture-ouverte@1` proposé) ; aucun manifeste `facturation` n'existe aujourd'hui (dû le 20/11, lot 2). La Créance d'une facture reprise s'ouvre chez `paiement` sur le fait `facturation.facture.reprise@1` (FR-216, FR-247) ; tant que le manifeste `facturation` n'existe pas, la reprise des factures impayées n'a **pas de cible codée**. `paiement.objetsDeReprise` reste `[]`.
6. **`domainesEchange` d'argent** (`facturation.factures`, `paiement.encaissements`, `paiement.creances`) : chaque domaine d'argent déclare `controle: true` et ses valeurs de contrôle. La règle du point d'écriture unique par domaine vaut dès la construction, même si Connecteurs est hors février.
7. ✅ **Tranché (PO, 2026-11-12).** Les dépendances dures sont validées : `commande` et `facturation` vers `catalogue` et `pdv`, `facturation` vers `paiement`, `approvisionnement` vers `stock` et `catalogue`, `entrepot` vers `stock` et `commande`, `freelance` vers `catalogue` et `pdv`. Il n'y a pas de vente anonyme : la vente au comptoir passe par le « client comptoir » générique de chaque point de stock (FR-241). `pdv` et `catalogue` listent déjà `commande` en `enrichiPar` : pas de cycle.
8. **`terrain` et `recouvrement`** servent deux verticales : leurs dépendances dures ne doivent pas nommer un module d'une seule verticale (`terrain` ne dépend que de `reseau`, `recouvrement` de `paiement` et `notification`) ; les sources propres à une verticale passent par `enrichiPar`.
9. **Service porteur de `facturation`** : la Créance est tenue par `paiement-service` (FR-247) ; la facture, ses lignes, ses avoirs et ses séries de numérotation sont tenus par un service `facturation` [À CONFIRMER, M09]. Deux modules dans un même service ne partagent pas de collection qu'ils écrivent tous deux (contrat §4) : `facturation` n'écrit jamais dans la collection des Créances.
10. **`freelance` est un add-on, pas un module** (M42, [À CONFIRMER] au manifeste) : si la décision est « option de pack », les lignes A.7 deviennent des droits et un profil de `catalogue` et `pdv`, et le manifeste disparaît. Le modèle économique, lui, est tranché : vente pour le compte de la société (décision du PO du 2026-11-12).
11. **`paiement` reçoit deux contrats nouveaux** (FR-247, FR-248) : le registre des Créances à tiers, source, périmètre et composantes, et le crédit du tiers. L'amendement du PRD `paiement` s'écrit avant la validation du lot ; `facturation`, `recouvrement` et `commande` en dépendent.

## Annexe B. Matrice d'accès

Cette annexe est la table unique de FR-5. Le menu en est une projection ; **le serveur l'applique** sur chaque écran et chaque route d'API. Elle reprend la table de la démo (`route-access.ts` du 12/11/2026, extrait pilotage §1.1 : 14 rôles), y ajoute `DIST_ADMIN` et les écrans à créer, et la corrige par les règles de périmètre (FR-6 à FR-8) :

- **Chacun son périmètre, appliqué par le serveur.** Une route ouverte ne donne que les données du périmètre du rôle. Un filtre vide ne retombe jamais sur « toute l'organisation ».
- **Pas de « Vue DG » hors DG et DC.** La vue de direction (rang de zone, priorités du DG, mention « Vue DG ») ne s'affiche qu'au DG et au DC, sur tous les écrans (FR-7, FR-186).
- **Une route absente de la table est refusée** (la démo l'ouvrait à tous les rôles connectés). Une adresse saisie à la main hors droit rend « accès refusé » ; un appel d'API rend un refus nommé, sans donnée.
- `MARKETING` et `RECOUVREMENT` lisent le réseau sans chiffre d'affaires ni créance détaillés hors de leur besoin (FR-6).
- `DIST_ADMIN` administre ; il ne lit aucune donnée métier (chiffre d'affaires, créance, prix, marge).
- Les attributions sont **par défaut, modifiables** par `DIST_ADMIN` sans déploiement (FR-4).

### B.1 Rôles × écrans

Légende des cellules : **R** tout le réseau · **Rg** sa région · **Z** sa zone · **P** son portefeuille · **E** son entrepôt · **L** lecture seule (tout le réseau) · **—** refusé.
Colonnes : DG · DC · RV = `RESP_VENTES` · SUP = `SUPERVISEUR` · COM = `COMMERCIAL` · FRL = `FREELANCE` · PRO = `PROSPECTION` · RST = `RESP_STOCK` · GE = `GEST_ENTREPOT` · DAF · CPT = `COMPTABLE` · CG = `CONTROLE_GESTION` · MKT = `MARKETING` · REC = `RECOUVREMENT` · ADM = `DIST_ADMIN`.

| Écran | Module | DG | DC | RV | SUP | COM | FRL | PRO | RST | GE | DAF | CPT | CG | MKT | REC | ADM |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/dashboard` (cockpit du rôle) | `dashboard` | R | R | Rg | Z | P | P | P | R | E | R | R | R | R | R | — |
| `/pilotage-financier` (hors février) | `finance-transactions` | R | R | — | — | — | — | — | — | — | R | — | — | — | — | — |
| `/tournees` | `terrain` | R | R | — | Z | — | — | — | — | — | — | — | — | — | — | — |
| `/commercial` (carte d'équipe) | `terrain` | R | R | Rg | Z | — | — | — | — | — | — | — | — | — | — | — |
| `/mon-activite` (« Ma journée », application terrain) | `terrain` | — | — | — | — | P | P | P | — | — | — | — | — | — | — | — |
| `/disponibilite` | `commande` | — | — | — | — | P | P | P | — | — | — | — | — | — | — | — |
| `/commandes` | `commande` | R | R | Rg | Z | P | P | P | R | — | — | R | — | — | — | — |
| `/points-de-vente` | `pdv` | R | R | Rg | Z | P | P | P | — | — | — | — | — | R | R | — |
| `/prospection` | `conquete-objectifs` | R | R | Rg | — | — | — | P | — | — | — | — | — | — | — | — |
| `/objectifs` | `conquete-objectifs` | R | R | Rg | — | — | — | — | — | — | — | — | R | — | — | — |
| `/equipe` | `equipe` | R | R | Rg | Z | — | — | — | — | — | — | — | R | — | — | — |
| `/catalogue` (écrans propres, FR-197) | `catalogue` | R | R | R | R | — | P | — | R | — | R | R | R | R | — | — |
| `/stock` | `stock` | R | R | R | R | — | — | — | R | E | R | R | R | R | — | — |
| `/entrepot` | `entrepot` | R | — | — | — | — | — | — | R | E | — | — | — | — | — | — |
| `/approvisionnement` | `approvisionnement` | R | — | — | — | — | — | — | R | — | R | R | — | — | — | — |
| `/facturation` | `facturation` | R | R | Rg | — | P | P | P | — | — | R | R | L | — | R | — |
| `/encaissements` (à créer) | `paiement` | R | L | — | — | — | — | — | — | — | R | R | — | — | R | — |
| `/relances` | `recouvrement` | R | R | Rg | Z | P | — | — | — | — | R | — | — | — | R | — |
| `/comptabilite` (hors février) | `finance-transactions` | R | — | — | — | — | — | — | — | — | R | R | — | — | R | — |
| `/controle-gestion` | `controle-gestion` | — | — | — | — | — | — | — | — | — | — | — | R | — | — | — |
| `/marketing` | `marketing` | R | R | — | — | — | — | — | — | — | — | — | — | R | — | — |
| `/marketing/social` (hors février) | `studio-social` | R | R | — | — | — | — | — | — | — | — | — | — | R | — | — |
| `/automatisations` | `automatisations` | R | — | — | — | — | — | — | — | — | — | — | — | R | R | — |
| `/notifications` (modèles, journal ; à créer) | `notification` | R | — | — | — | — | — | — | — | — | — | — | — | R | R | R |
| `/reprise` (à créer) | `reprise` | R | — | — | — | — | — | — | — | — | R | R | — | — | — | R |
| `/administration` (utilisateurs, rôles, périmètres, garde-fous ; à créer) | socle | R | — | — | — | — | — | — | — | — | — | — | — | — | — | R |
| `/integrations` (hors février) | `connecteurs` | R | — | — | — | — | — | — | — | — | R | — | — | — | — | R |

Précisions par cellule :
- **COM, PRO sur `/facturation`** : leurs proformas et les factures de leur portefeuille (« Mes proformas »). **FRL** : les factures qu'il émet à ses détaillants, dans son espace propre ; la société ne les voit jamais.
- **FRL sur `/catalogue`** : l'écran « Mes prix » seulement (FR-C28 à FR-C30).
- **CG sur `/facturation`** : onglet « Factures » en lecture seule ; il voit la marge **par axe**, pas la marge de chaque facture. La démo lui ouvrait la route sans onglet (écran vide).
- **CPT sur `/commandes`** : saisie d'une commande au bureau, avec le droit (la démo ne l'ouvrait pas). **GE** n'a pas `/commandes` : il reçoit les bons de préparation dans `/entrepot`, où il confirme aussi la livraison.
- **RV** n'a pas `/tournees` : il pilote par zone, par ses superviseurs (choix de la démo). **SUP** n'a pas `/facturation` : il arbitre les remises par les validations.
- **PRO** n'a pas `/marketing` ; la vue opérateur que la démo lui prévoyait n'est pas reprise.
- **DC sur `/encaissements`** : lecture seule. **DG sur `/controle-gestion`** : refusé (écran exclusif du contrôleur) ; le DG reçoit les rapports.
- **Hors février** : `finance-transactions` (décision du PO du 2026-11-12), `studio-social`, `connecteurs` ; leurs écrans n'apparaissent que si le module est installé.

**Libellés du menu** (donnée de la table, pas du code, FR-5) :

| Rôle | Écran | Libellé |
|---|---|---|
| `COMMERCIAL` | `/dashboard`, `/points-de-vente`, `/facturation`, `/relances` | « Ma journée », « Mes clients », « Mes proformas », « Mes relances » |
| `FREELANCE` | `/points-de-vente`, `/catalogue` | « Mon portefeuille », « Mes prix » |
| `PROSPECTION` | `/points-de-vente`, `/prospection` | « Mes ouvertures », « Ma conquête » |
| `MARKETING` | `/points-de-vente`, `/stock` | « Mon audience », « Produits à écouler » |
| `RECOUVREMENT` | `/points-de-vente`, `/relances` | « Clients débiteurs », « Mes dossiers » |
| `GEST_ENTREPOT` | `/entrepot`, `/stock` | « Mon entrepôt », « Stock de mon site » |

**Conséquences (testables) :** (1) pour chaque couple (rôle, écran) marqué « — », l'adresse saisie à la main rend « accès refusé » et l'appel d'API un refus nommé sans donnée ; (2) pour chaque cellule P, Z, Rg ou E, la liste ne contient que des lignes du périmètre (jeu de test : un commercial de Lomé Centre ne voit aucun point de vente de Kara) ; (3) aucun rôle hors DG et DC ne reçoit la vue de direction, même en forçant l'adresse ; (4) changer un libellé de menu ne demande aucun déploiement.

### B.2 Par module, rôles × droits

Droits de l'annexe A (modules des parties 2 et 3) et des manifestes (modules de la partie 4). Chaque droit s'exerce sur le périmètre du rôle (B.1). Règles de séparation : préparer et valider un ordre de paiement sont deux personnes ; celui qui déclare un encaissement ne le valide pas ; `DIST_ADMIN` ne reçoit aucun droit qui lit une donnée métier. Les droits marqués *(nouveau)* sont à ajouter au manifeste du module et à `auth-service`.

| Module | Droit | Rôles par défaut |
|---|---|---|
| `reseau` | `reseau:noeud:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, RESP_STOCK, CONTROLE_GESTION, DIST_ADMIN |
| `reseau` | `reseau:noeud:modifier` | DC, DIST_ADMIN |
| `reseau` | `reseau:decoupage:modifier` | DC |
| `reseau` | `reseau:affectation:modifier` | DC, RESP_VENTES, DIST_ADMIN |
| `reseau` | `reseau:portee:attribuer` | DIST_ADMIN (borné par sa propre portée), DG |
| ★ `pdv` | `pdv:portefeuille:consulter` | COMMERCIAL, FREELANCE, PROSPECTION |
| ★ `pdv` | `pdv:reseau:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, MARKETING, RECOUVREMENT (raffiné par la portée) |
| ★ `pdv` | `pdv:fiche:creer` | COMMERCIAL, PROSPECTION, SUPERVISEUR, RESP_VENTES, DC |
| ★ `pdv` | `pdv:portefeuille:reaffecter` | RESP_VENTES, DC |
| ★ `pdv` | `pdv:plafond:modifier` | DAF, DG |
| ★ `pdv` | `pdv:regle:definir` | DC, DIST_ADMIN |
| ★ `pdv` | `pdv:nature:modifier` | DC, RESP_STOCK |
| ★ `pdv` | `pdv:transition:corriger` | SUPERVISEUR, RESP_VENTES, DC |
| ★ `pdv` | `pdv:depart:declarer` | DC, DIST_ADMIN |
| ★ `catalogue` | `catalogue:article:consulter` | tous les rôles métier |
| ★ `catalogue` | `catalogue:article:gerer` | RESP_STOCK, DC |
| ★ `catalogue` | `catalogue:grille:gerer` | DC, DAF |
| ★ `catalogue` | `catalogue:promotion:gerer` | DC, MARKETING |
| ★ `catalogue` | `catalogue:marge:consulter` *(nouveau, FR-196)* | DG, DC, DAF, CONTROLE_GESTION (marge par axe) |
| ★ `stock` | `stock:etat:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT, DAF, COMPTABLE, CONTROLE_GESTION, MARKETING |
| ★ `stock` | `stock:valeur-achat:consulter` *(nouveau, FR-196)* | DG, DC, DAF, RESP_STOCK |
| ★ `stock` | `stock:mouvement:saisir` | RESP_STOCK, GEST_ENTREPOT |
| ★ `stock` | `stock:ajustement:valider` | RESP_STOCK (au-delà de son plafond : DAF) |
| ★ `stock` | `stock:inventaire:realiser` | GEST_ENTREPOT, RESP_STOCK |
| ★ `stock` | `stock:transfert:lancer` *(nouveau, FR-245)* | DG, DC, DAF, RESP_STOCK |
| ★ `stock` | `stock:liquidation:lancer` *(nouveau, FR-246)* | DG, DC, DAF, RESP_STOCK |
| ★ `stock` | `stock:valorisation:configurer` | DAF |
| ★ `stock` | `stock:entrepot:administrer` | RESP_STOCK, DIST_ADMIN |
| ★ `paiement` | `paiement:demande:emettre` (lien, QR ; préparer un ordre) | COMMERCIAL, FREELANCE, PROSPECTION, RECOUVREMENT, COMPTABLE, DAF |
| ★ `paiement` | `paiement:lien:revoquer` | COMPTABLE, DAF, RECOUVREMENT |
| ★ `paiement` | `paiement:encaissement:declarer` | COMMERCIAL, FREELANCE, PROSPECTION, COMPTABLE, RECOUVREMENT |
| ★ `paiement` | `paiement:encaissement:valider` (valider un encaissement déclaré, un ordre) | SUPERVISEUR (remises d'espèces), COMPTABLE, DAF ; jamais le déclarant ; un ordre préparé par le comptable est validé par le DAF |
| ★ `paiement` | `paiement:annulation:enregistrer` | COMPTABLE, DAF |
| ★ `paiement` | `paiement:compte:administrer` | DAF, DIST_ADMIN |
| ★ `paiement` | `paiement:journal:consulter` | DG, DAF, COMPTABLE, CONTROLE_GESTION |
| ★ `paiement` | `paiement:creance:consulter` *(nouveau, FR-247)* | DG, DC, RESP_VENTES, SUPERVISEUR, DAF, COMPTABLE, CONTROLE_GESTION, RECOUVREMENT ; COMMERCIAL et FREELANCE pour leur portefeuille |
| ★ `paiement` | `paiement:credit-tiers:imputer` *(nouveau, FR-248)* | COMPTABLE, DAF |
| `notification` | `notification:modele:rediger` | MARKETING, RECOUVREMENT |
| `notification` | `notification:envoi-de-masse:executer` | MARKETING |
| `notification` | `notification:envoi-de-masse:valider` | DG, DC (deux personnes : jamais celui qui exécute) |
| `notification` | `notification:journal:consulter` | DG, MARKETING, RECOUVREMENT, DIST_ADMIN |
| `notification` | `notification:canal:administrer` | DIST_ADMIN |
| `notification` | `notification:donnees:administrer` | DIST_ADMIN |
| `reprise` | `reprise:lot:importer` | DIST_ADMIN, COMPTABLE |
| `reprise` | `reprise:lot:valider` | attribué par le DG seul (Reprise FR-13) ; par défaut DG et DAF |
| `reprise` | `reprise:doublon:fusionner` | COMPTABLE, DIST_ADMIN |
| `reprise` | `reprise:rapport:consulter` | DG, DAF, COMPTABLE, DIST_ADMIN |
| `reprise` | `reprise:regle:modifier` | DIST_ADMIN |
| `reprise` | `reprise:comptage:saisir` | GEST_ENTREPOT, RESP_STOCK |
| `connecteurs` (hors février) | `connecteurs:file:consulter`, `connecteurs:refus:renvoyer`, `connecteurs:ecart:trancher`, `connecteurs:file:reprendre` | DAF (consulter, trancher), COMPTABLE (renvoyer), DIST_ADMIN (consulter, reprendre) |
| ★ `commande` | `commande:commande:saisir` | DC, RESP_VENTES, COMMERCIAL, FREELANCE, PROSPECTION, COMPTABLE |
| ★ `commande` | `commande:commande:valider` | DC, RESP_VENTES, SUPERVISEUR, COMPTABLE |
| ★ `commande` | `commande:commande:annuler` | DC, RESP_VENTES, COMPTABLE |
| ★ `commande` | `commande:portefeuille:consulter` | COMMERCIAL, FREELANCE, PROSPECTION |
| ★ `commande` | `commande:reseau:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, RESP_STOCK, COMPTABLE (raffiné par la portée) |
| ★ `commande` | `commande:remise:valider` | SUPERVISEUR, RESP_VENTES, DC |
| ★ `commande` | `commande:bon-livraison:emettre` | DC, RESP_VENTES, SUPERVISEUR, COMPTABLE, RESP_STOCK |
| ★ `facturation` | `facturation:facture:emettre` | COMPTABLE, DAF ; FREELANCE pour ses propres factures, dans son espace |
| ★ `facturation` | `facturation:facture:consulter` | DG, DC, RESP_VENTES, DAF, COMPTABLE, CONTROLE_GESTION (lecture), RECOUVREMENT ; COMMERCIAL, FREELANCE, PROSPECTION pour leur portefeuille |
| ★ `facturation` | `facturation:avoir:emettre` | COMPTABLE, DAF |
| ★ `facturation` | `facturation:proforma:gerer` | DC, RESP_VENTES, COMMERCIAL, FREELANCE, PROSPECTION, COMPTABLE, DAF |
| ★ `facturation` | `facturation:balance:consulter` | DG, DC, RESP_VENTES, DAF, COMPTABLE, CONTROLE_GESTION, RECOUVREMENT |
| ★ `facturation` | `facturation:numerotation:administrer` | DAF (initialisation par la reprise, une fois) |
| `approvisionnement` | `approvisionnement:fournisseur:gerer` | RESP_STOCK, DAF |
| `approvisionnement` | `approvisionnement:commande-fournisseur:suggerer` | RESP_STOCK |
| `approvisionnement` | `approvisionnement:commande-fournisseur:valider` | RESP_STOCK sous son plafond de validation ; au-delà DAF, puis DG |
| `approvisionnement` | `approvisionnement:reception:enregistrer` | GEST_ENTREPOT, RESP_STOCK |
| `approvisionnement` | `approvisionnement:regle:definir` | DG, RESP_STOCK |
| `entrepot` | `entrepot:preparation:realiser`, `entrepot:chargement:gerer`, `entrepot:reception:controler` | GEST_ENTREPOT |
| `entrepot` | `entrepot:expedition:gerer` | GEST_ENTREPOT, RESP_STOCK |
| `entrepot` | `entrepot:inventaire:planifier` | RESP_STOCK |
| `entrepot` | `entrepot:livraison:confirmer` | GEST_ENTREPOT, COMMERCIAL (agent de terrain) |
| `conquete-objectifs` | `conquete-objectifs:prospect:gerer` | PROSPECTION, RESP_VENTES |
| `conquete-objectifs` | `conquete-objectifs:zone-blanche:recenser`, `conquete-objectifs:passation:declarer` | PROSPECTION |
| `conquete-objectifs` | `conquete-objectifs:objectif:definir` | DC, RESP_VENTES (sa région), DIST_ADMIN |
| `conquete-objectifs` | `conquete-objectifs:objectif:consulter` | DG, DC, RESP_VENTES, CONTROLE_GESTION ; PROSPECTION pour les siens |
| `studio-social` (hors février) | `studio-social:publication:programmer`, `studio-social:message:repondre` | MARKETING |
| `studio-social` (hors février) | `studio-social:publication:valider` | DG, DC |
| `studio-social` (hors février) | `studio-social:compte:connecter` | MARKETING, DIST_ADMIN |
| `freelance` | `freelance:portefeuille:consulter`, `freelance:creance:consulter` | FREELANCE (les siens) |
| `freelance` | `freelance:commission:consulter` *(nouveau)* | FREELANCE (la sienne) ; DG, DC, DAF par droit explicite (FR-8) |
| `freelance` | `freelance:classement:consulter` | DG, DC, RESP_VENTES ; FREELANCE (le sien) |
| `freelance` | `freelance:freelance:activer` | DC, DIST_ADMIN |
| ★ `terrain` | `terrain:visite:realiser` | COMMERCIAL, FREELANCE, PROSPECTION |
| ★ `terrain` | `terrain:tournee:planifier` | SUPERVISEUR, DC |
| ★ `terrain` | `terrain:equipe:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR |
| ★ `terrain` | `terrain:mission:affecter` | SUPERVISEUR, RESP_VENTES |
| ★ `terrain` | `terrain:remise:declarer` | COMMERCIAL, PROSPECTION |
| ★ `terrain` | `terrain:remise:valider` | SUPERVISEUR, COMPTABLE (jamais le déclarant) |
| ★ `recouvrement` | `recouvrement:dossier:traiter`, `recouvrement:promesse:enregistrer` | RECOUVREMENT, SUPERVISEUR ; COMMERCIAL pour son portefeuille |
| ★ `recouvrement` | `recouvrement:relance:envoyer` | RECOUVREMENT ; COMMERCIAL pour son portefeuille |
| ★ `recouvrement` | `recouvrement:credit:bloquer` | RECOUVREMENT, DAF (blocage manuel ; le blocage au seuil est automatique) |
| ★ `recouvrement` | `recouvrement:credit:debloquer` | DAF seul |
| ★ `recouvrement` | `recouvrement:regle:definir` | DAF, DIST_ADMIN |
| ★ `recouvrement` | `recouvrement:balance:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, DAF, COMPTABLE, RECOUVREMENT |
| `equipe` | `equipe:indicateur:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, CONTROLE_GESTION ; chaque rôle lit son propre KPI de poste sans ce droit |
| `equipe` | `equipe:classement:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR |
| `equipe` | `equipe:coaching:gerer` | SUPERVISEUR, RESP_VENTES, DC |
| `equipe` | `equipe:remuneration:consulter` *(nouveau, FR-8)* | DG, DC, DAF ; chaque agent pour lui-même ; jamais SUPERVISEUR ni CONTROLE_GESTION |
| `finance-transactions` (hors février) | `finance-transactions:rapprochement:effectuer`, `finance-transactions:suspens:traiter` | COMPTABLE |
| `finance-transactions` (hors février) | `finance-transactions:tresorerie:consulter` | DG, DC, DAF |
| `finance-transactions` (hors février) | `finance-transactions:run:consulter` | DG, DAF |
| `marketing` | `marketing:campagne:gerer`, `marketing:segment:gerer` | MARKETING |
| `marketing` | `marketing:campagne:valider` | DG, DC |
| `marketing` | `marketing:combo:proposer` | MARKETING, RESP_STOCK |
| `marketing` | `marketing:combo:valider` | DG, DC (remise de 12 % ou plus) |
| `marketing` | `marketing:audience:consulter` | MARKETING, DC |
| `controle-gestion` | `controle-gestion:budget:fixer`, `controle-gestion:rapport:envoyer`, `controle-gestion:prevision:gerer` | CONTROLE_GESTION |
| `controle-gestion` | `controle-gestion:budget:consulter` | CONTROLE_GESTION, DG, DAF |
| `automatisations` | `automatisations:regle:gerer` | DG, DIST_ADMIN |
| `automatisations` | `automatisations:regle:activer` | DG |
| `automatisations` | `automatisations:cible:valider` | le rôle qui détient le droit du module source (MARKETING, RECOUVREMENT, RESP_STOCK) |
| `automatisations` | `automatisations:journal:consulter` | DG, MARKETING, RECOUVREMENT, RESP_STOCK |
| `dashboard` | `dashboard:tableau:consulter` | les 14 rôles métier (chacun son cockpit) |
| `dashboard` | `dashboard:vue-direction:consulter` | DG, DC seulement |
| `dashboard` | `dashboard:rapport:envoyer` | DG, DAF, CONTROLE_GESTION |
| `dashboard` | `dashboard:alerte:configurer` | DG, DIST_ADMIN |
| `support-client` (hors février) | `support-client:dossier:ouvrir`, `support-client:dossier:traiter`, `support-client:dossier:cloturer` | attribués au cadrage du module (écrans à concevoir) |

**Conséquences (testables) :** (1) sur le jeu de test, chaque rôle reçoit exactement les droits de cette table à la création de l'organisation ; (2) un droit retiré par `DIST_ADMIN` prend effet à la requête suivante ; (3) la personne qui a préparé un ordre de paiement ne peut pas le valider, même si elle détient les deux droits ; (4) `DIST_ADMIN` n'obtient aucune réponse contenant un montant, un prix ou une marge ; (5) chaque droit *(nouveau)* existe au catalogue d'`auth-service` avant la livraison de son module.
